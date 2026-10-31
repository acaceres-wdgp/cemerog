import React, { FormEvent, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import FormField from '@/components/cemerog/FormField';
import PatientSearch from '@/components/cemerog/PatientSearch';
import type { PatientResult } from '@/components/cemerog/PatientSearch';
import { emergencia } from '@/routes';
import * as ingreso from '@/routes/emergencia/ingreso';
import * as pacientes from '@/routes/emergencia/pacientes';
import AdmissionSidebar from './components/AdmissionSidebar';
import NewPatientFields, {
    emptyNewPatient,
    newPatientIsValid,
} from './components/NewPatientFields';
import type { NewPatient } from './components/NewPatientFields';

type Props = {
    cubicles: { id: number; name: string }[];
    doctors: { id: number; name: string; specialty: string | null }[];
    default_doctor_id: number | null;
    selected_cubicle_id?: number | null;
    emergency_fee: number;
    arrived_at: string;
};

type Found = PatientResult & { in_emergency?: boolean };

export default function EmergenciaIngreso({
    cubicles,
    doctors,
    default_doctor_id,
    selected_cubicle_id = null,
    emergency_fee,
    arrived_at,
}: Props) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [query, setQuery] = useState('');
    const [found, setFound] = useState<Found | null>(null);
    const [patient, setPatient] = useState<NewPatient>(emptyNewPatient);
    const [cubicleId, setCubicleId] = useState(() => {
        const preselected = cubicles.find((c) => c.id === selected_cubicle_id);
        const first = preselected ?? cubicles[0];
        return first ? String(first.id) : '';
    });
    const [doctorId, setDoctorId] = useState(
        default_doctor_id ? String(default_doctor_id) : '',
    );
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const canSubmit =
        (found ? !found.in_emergency : newPatientIsValid(patient)) &&
        cubicleId !== '' &&
        doctorId !== '' &&
        reason.trim() !== '';

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsLoading(true);
        const common = {
            cubicle_id: Number(cubicleId),
            doctor_id: Number(doctorId),
            reason: reason.trim(),
        };
        router.post(
            ingreso.store.url(),
            found
                ? { patient_id: found.id, ...common }
                : {
                      ...patient,
                      document_number:
                          patient.document_type === 'no_tiene'
                              ? null
                              : patient.document_number.trim(),
                      ...common,
                  },
            { onFinish: () => setIsLoading(false) },
        );
    };

    const doctor = doctors.find((d) => String(d.id) === doctorId);

    return (
        <form onSubmit={submit} className="flex flex-col gap-4">
            <p className="m-0 text-text-secondary">
                Registra lo mínimo para empezar a atender. El resto del perfil
                se completa después, cuando el paciente esté estable.
            </p>
            <div className="flex flex-wrap items-start gap-4">
                <section className="min-w-0 flex-[2_1_520px] rounded-[14px] border border-card-border bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-5 py-[14px]">
                        <div>
                            <h2 className="m-0 font-serif text-[16px] font-semibold text-text-heading">
                                Datos mínimos
                            </h2>
                            <div className="text-[13px] text-muted">
                                Llegada registrada automáticamente: {arrived_at}
                            </div>
                        </div>
                        <span className="state-emergencia inline-flex items-center gap-1.5 rounded-full bg-[var(--state-bg)] px-[10px] py-[3px] text-[12px] font-medium text-[var(--state-text)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--state-accent)]" />
                            Emergencia
                        </span>
                    </div>
                    <div className="flex flex-col gap-4 px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[14px] font-medium text-text-heading">
                                ¿Ya está registrado?
                            </span>
                            <PatientSearch
                                selected={found}
                                query={query}
                                onQueryChange={setQuery}
                                onSelect={(p) => setFound(p as Found)}
                                onClear={() => {
                                    setFound(null);
                                    setQuery('');
                                }}
                                endpoint={pacientes.buscar.url()}
                                placeholder="Buscar por cédula o pasaporte…"
                                error={errors.patient_id}
                            />
                            {found?.in_emergency && (
                                <span className="text-xs text-error">
                                    Este paciente ya está en emergencia.
                                </span>
                            )}
                            {!found && (
                                <span className="text-[12.5px] text-muted">
                                    Si no aparece, completa los datos mínimos
                                    para registrarlo.
                                </span>
                            )}
                        </div>

                        {!found && (
                            <NewPatientFields
                                value={patient}
                                errors={errors}
                                onChange={(p) =>
                                    setPatient((v) => ({ ...v, ...p }))
                                }
                            />
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                                as="select"
                                name="cubicle_id"
                                label="Cubículo"
                                value={cubicleId}
                                onChange={(e) => setCubicleId(e.target.value)}
                                error={
                                    errors.cubicle_id ??
                                    (cubicles.length === 0
                                        ? 'No hay cubículos libres.'
                                        : undefined)
                                }
                                required
                            >
                                {cubicles.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </FormField>
                            <FormField
                                as="select"
                                name="doctor_id"
                                label="Médico de turno"
                                value={doctorId}
                                onChange={(e) => setDoctorId(e.target.value)}
                                error={errors.doctor_id}
                                required
                            >
                                <option value="">Elegir…</option>
                                {doctors.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                        {d.specialty ? ` · ${d.specialty}` : ''}
                                    </option>
                                ))}
                            </FormField>
                        </div>
                        <FormField
                            as="textarea"
                            name="reason"
                            label="Motivo de llegada"
                            rows={3}
                            placeholder="Ej.: herida cortante en mano derecha con sangrado activo"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            error={errors.reason}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-divider px-5 py-3">
                        <Link
                            href={emergencia.url()}
                            className="inline-flex h-9 items-center rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium text-text-body hover:bg-accent-bg"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={!canSubmit || isLoading}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-primary-disabled"
                        >
                            <Check className="h-4 w-4" />
                            Registrar en emergencia
                        </button>
                    </div>
                </section>
                <div className="min-w-0 flex-[1_1_280px]">
                    <AdmissionSidebar
                        unidentified={!found && !patient.identified}
                        noDocument={
                            !found && patient.document_type === 'no_tiene'
                        }
                        existing={found !== null}
                        doctorName={doctor?.name ?? null}
                        fee={emergency_fee}
                    />
                </div>
            </div>
        </form>
    );
}
