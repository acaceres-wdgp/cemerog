<?php

/*
 * Shared fixtures of the results portal tests: an account (atención) with a
 * hemograma and a chest X-ray, billed or not, and its results code.
 */

use App\Actions\Results\GenerateResultAccessCode;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\ImagingOrder;
use App\Models\ImagingStudy;
use App\Models\Invoice;
use App\Models\LabOrder;
use App\Models\LabOrderItem;
use App\Models\LabResult;
use App\Models\LabTest;
use App\Models\Patient;
use App\Models\ResultAccessCode;
use App\Models\User;
use Illuminate\Testing\TestResponse;

function portalStaff(string $role = 'caja'): User
{
    $user = User::factory()->create(['name' => "Usuario {$role}"]);
    $user->assignRole($role);

    return $user;
}

function portalPatient(): Patient
{
    return Patient::factory()->create([
        'first_names' => 'Rosa María',
        'last_names' => 'Peña Almonte',
        'birth_date' => '1992-05-21',
        'sex' => 'F',
    ]);
}

/** A charge of the account; lab and imaging charges also get their order */
function portalCharge(Account $account, User $by, string $type, string $description, int $price): AccountCharge
{
    return AccountCharge::create([
        'account_id' => $account->id,
        'created_by' => $by->id,
        'type' => $type,
        'description' => $description,
        'quantity' => 1,
        'unit_price' => $price,
        'total' => $price,
    ]);
}

function portalAccount(Patient $patient, User $by, array $types = ['consulta', 'laboratorio', 'imagen']): Account
{
    $account = Account::create([
        'patient_id' => $patient->id,
        'service_date' => today()->toDateString(),
        'status' => 'pendiente_facturar',
        'opened_at' => now(),
    ]);
    foreach ($types as $type) {
        match ($type) {
            'laboratorio' => portalLabOrder($account, $by),
            'imagen' => portalImagingOrder($account, $by),
            default => portalCharge($account, $by, $type, ucfirst($type), 100000),
        };
    }

    return $account;
}

/** Hemograma (glóbulos blancos 4.5–11, hemoglobina 12–16, aspecto «Claro») */
function portalLabOrder(Account $account, User $by, string $status = 'muestra'): LabOrderItem
{
    $test = LabTest::firstOrCreate(['code' => 'HEMO'], ['name' => 'Hemograma completo', 'category' => 'Hematología', 'price' => 30000, 'is_active' => true]);
    if ($test->parameters()->doesntExist()) {
        $test->parameters()->createMany([
            ['position' => 1, 'name' => 'Glóbulos blancos', 'result_type' => 'numerico', 'unit' => 'x10³/µL', 'min' => 4.5, 'max' => 11],
            ['position' => 2, 'name' => 'Hemoglobina', 'result_type' => 'numerico', 'unit' => 'g/dL', 'min' => 12, 'max' => 16],
            ['position' => 3, 'name' => 'Aspecto', 'result_type' => 'texto', 'normal_text' => 'CLARO'],
        ]);
    }
    $order = LabOrder::create([
        'patient_id' => $account->patient_id,
        'origin' => 'externo',
        'status' => $status,
        'ordered_at' => now(),
        'sample_at' => now(),
        'sample_by' => $by->id,
        'created_by' => $by->id,
    ]);
    $order->update(['number' => 'L-'.str_pad((string) $order->id, 4, '0', STR_PAD_LEFT)]);
    $charge = portalCharge($account, $by, 'laboratorio', 'Hemograma completo', 30000);
    $charge->update(['source_type' => LabOrderItem::class]);
    $item = LabOrderItem::create([
        'lab_order_id' => $order->id,
        'lab_test_id' => $test->id,
        'name' => 'Hemograma completo',
        'category' => 'Hematología',
        'price' => 30000,
        'account_charge_id' => $charge->id,
    ]);
    $charge->update(['source_id' => $item->id]);
    foreach ($test->parameters()->orderBy('position')->get() as $parameter) {
        LabResult::create([
            'lab_order_item_id' => $item->id,
            'lab_test_parameter_id' => $parameter->id,
            'position' => $parameter->position,
            'name' => $parameter->name,
            'reference' => $parameter->referenceText(),
        ]);
    }

    return $item;
}

/** The bioanalyst validates the hemograma: WBC high, Hb low, aspect normal */
function portalValidateLab(LabOrderItem $item, User $bioanalista): void
{
    $values = ['Glóbulos blancos' => '11.8', 'Hemoglobina' => '11.2', 'Aspecto' => 'Claro'];
    foreach ($item->results as $result) {
        $value = $values[$result->name];
        $result->update(['value' => $value, 'out_of_range' => $result->parameter->isOutOfRange($value)]);
    }
    $item->order->update(['status' => 'validada', 'validated_at' => now(), 'validated_by' => $bioanalista->id]);
}

function portalImagingOrder(Account $account, User $by, string $status = 'realizado'): ImagingOrder
{
    $study = ImagingStudy::firstOrCreate(['code' => 'RXT'], ['name' => 'Radiografía de tórax', 'modality' => 'Rayos X', 'price' => 120000, 'is_active' => true]);
    $charge = portalCharge($account, $by, 'imagen', 'Radiografía de tórax', 120000);
    $order = ImagingOrder::create([
        'patient_id' => $account->patient_id,
        'imaging_study_id' => $study->id,
        'name' => 'Radiografía de tórax',
        'modality' => 'Rayos X',
        'price' => 120000,
        'origin' => 'externo',
        'status' => $status,
        'ordered_at' => now(),
        'performed_at' => now(),
        'performed_by' => $by->id,
        'account_charge_id' => $charge->id,
        'created_by' => $by->id,
    ]);
    $order->update(['number' => 'I-'.str_pad((string) $order->id, 4, '0', STR_PAD_LEFT)]);
    $charge->update(['source_type' => ImagingOrder::class, 'source_id' => $order->id]);

    return $order;
}

function portalSignImaging(ImagingOrder $order, User $radiologo): void
{
    $order->update([
        'status' => 'listo',
        'findings' => 'Silueta cardíaca de tamaño normal.',
        'conclusion' => 'Estudio sin alteraciones.',
        'signed_at' => now(),
        'signed_by' => $radiologo->id,
    ]);
}

/**
 * Bill the account (as caja does) and return its plain results code,
 * formatted CMG-XXXX-XXXX. The plain code is only known at this moment.
 */
function portalCode(Account $account, User $by, ?string $plain = null): string
{
    $plain ??= 'ABCD2345';
    $code = ResultAccessCode::create([
        'account_id' => $account->id,
        'patient_id' => $account->patient_id,
        'invoice_id' => Invoice::where('account_id', $account->id)->latest('id')->value('id'),
        'code_hash' => ResultAccessCode::hashCode($plain),
        'code_encrypted' => $plain,
        'expires_at' => now()->addDays(90),
        'created_by' => $by->id,
    ]);

    return 'CMG-'.substr($plain, 0, 4).'-'.substr($plain, 4);
}

/** Enter the portal with the code and the birth date */
function portalLogin(string $code, string $birthDate = '21/05/1992'): TestResponse
{
    return test()->post('/resultados/acceso', ['code' => $code, 'birth_date' => $birthDate]);
}

function portalCurrentCode(Account $account): ?ResultAccessCode
{
    return GenerateResultAccessCode::currentFor($account);
}
