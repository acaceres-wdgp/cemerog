import { useState } from 'react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { PatientSearch } from './PatientSearch';
import { DoctorOption, PatientResult } from '../types';
import { SLOTS } from '../lib/dates';

export function NuevaCitaModal({
    onClose,
    doctors,
    defaultDate,
}: {
    onClose: () => void;
    doctors: DoctorOption[];
    defaultDate: string;
}) {
    const [patientQuery, setPatientQuery] = useState('');
    const [selectedPatient, setSelectedPatient] =
        useState<PatientResult | null>(null);
    const [doctorId, setDoctorId] = useState('');
    const [fecha, setFecha] = useState(defaultDate);
    const [hora, setHora] = useState('');
    const [tipo, setTipo] = useState('consulta');
    const [notas, setNotas] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    // SLOTS is imported but not used in render directly — kept for potential slot validation
    void SLOTS;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!selectedPatient) errs.patient_id = 'Selecciona un paciente.';
        if (!doctorId) errs.doctor_id = 'Selecciona un médico.';
        if (!fecha) errs.appointment_date = 'La fecha es obligatoria.';
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setProcessing(true);
        router.post(
            '/citas',
            {
                patient_id: selectedPatient!.id,
                doctor_id: Number(doctorId),
                appointment_date: fecha,
                appointment_time: hora || null,
                type: tipo,
                notes: notas || null,
            },
            {
                onSuccess: () => onClose(),
                onError: (e) => {
                    setErrors(e);
                    setProcessing(false);
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <>
            <div
                onClick={onClose}
                className="fixed inset-0 z-40 bg-black/40"
            />
            <div className="fixed z-[41] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[95vw] max-h-[90vh] bg-white rounded-2xl shadow-[0_24px_64px_-16px_rgba(16,40,24,.35)] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between shrink-0 border-b border-divider px-5 py-4">
                    <span className="font-serif font-semibold text-[17px] text-text-heading">
                        Nueva cita
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-[30px] h-[30px] border-0 rounded-lg cursor-pointer text-base bg-app-bg"
                    >
                        ✕
                    </button>
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="overflow-y-auto flex-1 flex flex-col"
                >
                    <div className="px-5 py-4 flex flex-col gap-[14px]">
                        <label className="flex flex-col gap-1.5 font-medium text-sm">
                            <span>Paciente *</span>
                            <PatientSearch
                                selected={selectedPatient}
                                query={patientQuery}
                                onQueryChange={(v) => setPatientQuery(v)}
                                onSelect={(p) => {
                                    setSelectedPatient(p);
                                    setPatientQuery('');
                                }}
                                onClear={() => {
                                    setSelectedPatient(null);
                                    setPatientQuery('');
                                }}
                                error={errors.patient_id}
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 font-medium text-sm">
                            <span>Médico *</span>
                            <select
                                value={doctorId}
                                onChange={(e) => setDoctorId(e.target.value)}
                                className={cn(
                                    'h-9 w-full rounded-[10px] border px-3 text-sm outline-none box-border font-[inherit] cursor-pointer',
                                    errors.doctor_id
                                        ? 'border-error'
                                        : 'border-input-border',
                                )}
                            >
                                <option value="">Seleccionar médico…</option>
                                {doctors.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} — {d.specialty}
                                    </option>
                                ))}
                            </select>
                            {errors.doctor_id && (
                                <span className="text-xs text-error">
                                    {errors.doctor_id}
                                </span>
                            )}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1.5 font-medium text-sm">
                                <span>Fecha *</span>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    className={cn(
                                        'h-9 w-full rounded-[10px] border px-3 text-sm outline-none box-border font-[inherit]',
                                        errors.appointment_date
                                            ? 'border-error'
                                            : 'border-input-border',
                                    )}
                                />
                                {errors.appointment_date && (
                                    <span className="text-xs text-error">
                                        {errors.appointment_date}
                                    </span>
                                )}
                            </label>
                            <label className="flex flex-col gap-1.5 font-medium text-sm">
                                <span>
                                    Hora{' '}
                                    <span className="font-normal text-muted">
                                        (opcional)
                                    </span>
                                </span>
                                <input
                                    type="time"
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    className="h-9 w-full rounded-[10px] border border-input-border px-3 text-sm outline-none box-border font-[inherit]"
                                />
                            </label>
                        </div>
                        <label className="flex flex-col gap-1.5 font-medium text-sm">
                            <span>Tipo</span>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                className="h-9 w-full rounded-[10px] border border-input-border px-3 text-sm outline-none box-border font-[inherit] cursor-pointer"
                            >
                                <option value="consulta">Consulta</option>
                                <option value="seguimiento">Seguimiento</option>
                                <option value="primera_vez">Primera vez</option>
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5 font-medium text-sm">
                            <span>
                                Notas{' '}
                                <span className="font-normal text-muted">
                                    (opcional)
                                </span>
                            </span>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                rows={2}
                                placeholder="Motivo de consulta, indicaciones…"
                                className="w-full rounded-[10px] border border-input-border px-3 py-2 text-sm outline-none box-border font-[inherit] resize-y leading-normal"
                            />
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 shrink-0 border-t border-divider px-5 py-[14px]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-3.5 rounded-[10px] font-medium cursor-pointer font-[inherit] text-sm border border-secondary-border bg-secondary-bg"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={cn(
                                'h-9 px-4 rounded-[10px] border-0 text-white font-medium font-[inherit] text-sm',
                                processing
                                    ? 'bg-primary-disabled cursor-not-allowed'
                                    : 'bg-primary cursor-pointer',
                            )}
                        >
                            {processing ? 'Guardando…' : '✓ Registrar cita'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
