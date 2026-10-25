import { useState } from 'react';
import { router } from '@inertiajs/react';
import AlertBanner from '@/components/cemerog/AlertBanner';
import FormDialog from '@/components/cemerog/FormDialog';
import PatientSearch from '@/components/cemerog/PatientSearch';
import type { PatientResult } from '@/components/cemerog/PatientSearch';
import type { DoctorOption } from '../types';

interface AgregarTurnoModalProps {
    onClose: () => void;
    doctors: DoctorOption[];
}

export function AgregarTurnoModal({
    onClose,
    doctors,
}: AgregarTurnoModalProps) {
    const [patientQuery, setPatientQuery] = useState('');
    const [selectedPatient, setSelectedPatient] =
        useState<PatientResult | null>(null);
    const [doctorId, setDoctorId] = useState('');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!selectedPatient) errs.patient_id = 'Selecciona un paciente.';
        if (!doctorId) errs.doctor_id = 'Selecciona un médico.';
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setProcessing(true);
        router.post(
            '/tablero/turnos',
            {
                patient_id: selectedPatient!.id,
                doctor_id: Number(doctorId),
                appointment_id: null,
                notes: notes || null,
            },
            {
                onSuccess: () => onClose(),
                onError: (e) => {
                    setErrors(e as Record<string, string>);
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
            title="Agregar turno"
            onSubmit={handleSubmit}
            isLoading={processing}
            submitLabel={processing ? 'Asignando…' : '+ Asignar turno'}
            maxWidth="max-w-[460px] w-[95vw]"
        >
            <div className="flex flex-col gap-3.5">
                <div className="rounded-[10px] border border-accent-tip-border bg-accent-bg px-[14px] py-[10px] text-[13px] text-primary">
                    Turno sin cita previa. El paciente se agrega directamente a
                    la cola de espera.
                </div>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
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
                        endpoint="/citas/pacientes/buscar"
                    />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    <span>Médico *</span>
                    <select
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        className={`box-border h-9 w-full cursor-pointer rounded-[10px] border px-3 font-[inherit] text-sm outline-none ${errors.doctor_id ? 'border-error' : 'border-input-border'}`}
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
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    <span>
                        Notas{' '}
                        <span className="font-normal text-muted">
                            (opcional)
                        </span>
                    </span>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Motivo de consulta…"
                        className="box-border w-full resize-y rounded-[10px] border border-input-border px-3 py-2 font-[inherit] text-sm leading-relaxed outline-none"
                    />
                </label>
                {errors.open_turn && (
                    <AlertBanner variant="danger">
                        {errors.open_turn}
                    </AlertBanner>
                )}
            </div>
        </FormDialog>
    );
}
