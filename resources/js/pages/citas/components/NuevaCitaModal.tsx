import { useState } from 'react';
import { router } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
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
        <FormDialog
            open={true}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title="Nueva cita"
            onSubmit={handleSubmit}
            isLoading={processing}
            submitLabel="✓ Registrar cita"
            maxWidth="max-w-[480px] w-[95vw]"
        >
            <div className="flex flex-col gap-[14px]">
                {/* Paciente field */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-heading">
                        Paciente <span className="text-error">*</span>
                    </label>
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
                </div>

                {/* Médico */}
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="doctor_id"
                        className="text-sm font-medium text-text-heading"
                    >
                        Médico <span className="text-error">*</span>
                    </label>
                    <select
                        id="doctor_id"
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        className="box-border h-9 w-full cursor-pointer rounded-[10px] border border-input-border px-3 font-[inherit] text-sm outline-none"
                    >
                        <option value="">Seleccionar médico…</option>
                        {doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name} — {d.specialty}
                            </option>
                        ))}
                    </select>
                    {errors.doctor_id && (
                        <p className="text-xs text-error" role="alert">
                            {errors.doctor_id}
                        </p>
                    )}
                </div>

                {/* Fecha + Hora */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="appointment_date"
                            className="text-sm font-medium text-text-heading"
                        >
                            Fecha <span className="text-error">*</span>
                        </label>
                        <input
                            id="appointment_date"
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="box-border h-9 w-full rounded-[10px] border border-input-border px-3 font-[inherit] text-sm outline-none"
                        />
                        {errors.appointment_date && (
                            <p className="text-xs text-error" role="alert">
                                {errors.appointment_date}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="appointment_time"
                            className="text-sm font-medium text-text-heading"
                        >
                            Hora{' '}
                            <span className="font-normal text-muted">
                                (opcional)
                            </span>
                        </label>
                        <input
                            id="appointment_time"
                            type="time"
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
                            className="box-border h-9 w-full rounded-[10px] border border-input-border px-3 font-[inherit] text-sm outline-none"
                        />
                    </div>
                </div>

                {/* Tipo */}
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="type"
                        className="text-sm font-medium text-text-heading"
                    >
                        Tipo
                    </label>
                    <select
                        id="type"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        className="box-border h-9 w-full cursor-pointer rounded-[10px] border border-input-border px-3 font-[inherit] text-sm outline-none"
                    >
                        <option value="consulta">Consulta</option>
                        <option value="seguimiento">Seguimiento</option>
                        <option value="primera_vez">Primera vez</option>
                    </select>
                </div>

                {/* Notas */}
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="notes"
                        className="text-sm font-medium text-text-heading"
                    >
                        Notas{' '}
                        <span className="font-normal text-muted">
                            (opcional)
                        </span>
                    </label>
                    <textarea
                        id="notes"
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        rows={2}
                        placeholder="Motivo de consulta, indicaciones…"
                        className="box-border w-full resize-y rounded-[10px] border border-input-border px-3 py-2 font-[inherit] text-sm leading-normal outline-none"
                    />
                </div>
            </div>
        </FormDialog>
    );
}
