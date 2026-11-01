import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import PatientSearch from '@/components/cemerog/PatientSearch';
import type { PatientResult } from '@/components/cemerog/PatientSearch';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import internamiento from '@/routes/internamiento';
import SurgeryFields from '@/components/cirugia/SurgeryFields';
import {
    draftComplete,
    draftPayload,
    emptyDraft,
} from '@/components/cirugia/types';
import type { SurgeryDraft } from '@/components/cirugia/types';
import BedOptions from './BedOptions';
import type { AdmissionOptions } from './types';

/**
 * Ingreso a internamiento. From Emergencia or Consulta the patient comes
 * with the attention (`emergencyId` / `turnId`); from the map, the patient
 * is searched. «Ingreso para cirugía» waits for the Cirugía module.
 */
export default function AdmitDialog({
    open,
    onOpenChange,
    options,
    patient,
    subtitle,
    emergencyId,
    turnId,
    initialBedId,
    initialDiagnosis = '',
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    options: AdmissionOptions;
    patient?: { id: number; full_name: string } | null;
    subtitle?: string;
    emergencyId?: number;
    turnId?: number;
    initialBedId?: number | null;
    initialDiagnosis?: string;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [chosen, setChosen] = useState<PatientResult | null>(null);
    const [query, setQuery] = useState('');
    const [bedId, setBedId] = useState<number | null>(
        initialBedId ?? options.beds[0]?.id ?? null,
    );
    const [doctorId, setDoctorId] = useState(
        String(options.default_doctor_id ?? ''),
    );
    const [diagnosis, setDiagnosis] = useState(initialDiagnosis);
    const [treatment, setTreatment] = useState('');
    const surgeryOptions = options.surgery ?? null;
    const [tab, setTab] = useState<'intern' | 'cir'>('intern');
    const [surgery, setSurgery] = useState<SurgeryDraft | null>(() =>
        surgeryOptions
            ? emptyDraft(
                  surgeryOptions,
                  new Date().toISOString().slice(0, 10),
                  options.default_doctor_id,
              )
            : null,
    );
    const forSurgery = tab === 'cir' && surgery !== null;
    const [isLoading, setIsLoading] = useState(false);
    const patientId = patient?.id ?? chosen?.id ?? null;

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            internamiento.admit.url(),
            {
                patient_id: patientId,
                emergency_id: emergencyId ?? null,
                turn_id: turnId ?? null,
                bed_id: bedId,
                doctor_id: Number(doctorId) || null,
                diagnosis: diagnosis.trim(),
                treatment: treatment.trim() || null,
                ...(forSurgery ? { surgery: draftPayload(surgery) } : {}),
            },
            { onFinish: () => setIsLoading(false) },
        );
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                forSurgery ? 'Ingreso para cirugía' : 'Ingreso a internamiento'
            }
            description={subtitle ?? (patient ? patient.full_name : undefined)}
            submitLabel={
                forSurgery ? 'Ingresar y programar' : 'Confirmar ingreso'
            }
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={
                !patientId ||
                !bedId ||
                !doctorId ||
                diagnosis.trim() === '' ||
                (forSurgery && !draftComplete(surgery))
            }
            maxWidth="sm:max-w-2xl"
        >
            <div className="flex flex-col gap-4">
                {surgeryOptions && (
                    <SegmentedControl<'intern' | 'cir'>
                        segments={[
                            { value: 'intern', label: 'Internamiento' },
                            { value: 'cir', label: 'Ingreso para cirugía' },
                        ]}
                        value={tab}
                        onChange={setTab}
                    />
                )}
                {!patient && (
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-medium">
                            Paciente *
                        </span>
                        <PatientSearch
                            selected={chosen}
                            query={query}
                            onQueryChange={setQuery}
                            onSelect={(p) => {
                                setChosen(p);
                                setQuery('');
                            }}
                            onClear={() => setChosen(null)}
                            error={errors.patient_id}
                            endpoint={internamiento.pacientes.buscar.url()}
                            placeholder="Buscar por nombre, cédula o expediente…"
                        />
                    </div>
                )}
                {patient && errors.patient_id && (
                    <p className="m-0 text-[12px] text-error">
                        {errors.patient_id}
                    </p>
                )}
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium">
                        Habitación y cama *
                    </span>
                    <BedOptions
                        beds={options.beds}
                        value={bedId}
                        onChange={setBedId}
                    />
                    {errors.bed_id && (
                        <p className="m-0 text-[12px] text-error">
                            {errors.bed_id}
                        </p>
                    )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                        as="select"
                        name="doctor_id"
                        label="Médico tratante"
                        required
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        error={errors.doctor_id}
                    >
                        <option value="">— Seleccionar médico —</option>
                        {options.doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name} — {d.specialty}
                            </option>
                        ))}
                    </FormField>
                    <FormField
                        name="diagnosis"
                        label="Diagnóstico de ingreso (CIE-10)"
                        required
                        placeholder="Ej.: J18.9 Neumonía, no especificada"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        error={errors.diagnosis}
                    />
                </div>
                <FormField
                    as="textarea"
                    name="treatment"
                    label="Tratamiento e indicaciones iniciales"
                    rows={3}
                    placeholder="Ej.: Ceftriaxona 1 g IV cada 12 horas. Signos vitales cada 4 horas."
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    error={errors.treatment}
                />
                {forSurgery && surgeryOptions && (
                    <div className="state-cirugia flex flex-col gap-2 rounded-[12px] border border-[var(--state-bg)] px-3 py-3">
                        <span className="text-[13px] font-semibold text-[var(--state-text)]">
                            Datos de la cirugía
                        </span>
                        <SurgeryFields
                            options={surgeryOptions}
                            value={surgery}
                            onChange={setSurgery}
                            errors={errors}
                            prefix="surgery."
                        />
                    </div>
                )}
                <p className="m-0 rounded-[10px] bg-list-row-bg px-3 py-2 text-[13px] text-text-secondary">
                    La atención pasa a{' '}
                    <span
                        className={`${forSurgery ? 'state-cirugia' : 'state-internado'} rounded-full bg-[var(--state-bg)] px-2 py-0.5 font-medium text-[var(--state-text)]`}
                    >
                        {forSurgery ? 'Internado por cirugía' : 'Internado'}
                    </span>
                    . La cuenta continúa durante la estancia y la habitación se
                    carga al dar el alta.
                </p>
            </div>
        </FormDialog>
    );
}
