import { useState } from 'react';
import { router } from '@inertiajs/react';
import { PatientSearch } from './PatientSearch';
import { DoctorOption, PatientResult } from '../types';
import { SLOTS } from '../lib/dates';

const inputStyle: React.CSSProperties = {
    height: 36,
    width: '100%',
    padding: '0 12px',
    border: '1px solid #e4e4e7',
    borderRadius: 10,
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: 14,
    boxSizing: 'border-box',
};

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
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 40,
                    background: 'rgba(0,0,0,.4)',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    zIndex: 41,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 480,
                    maxWidth: '95vw',
                    maxHeight: '90vh',
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 24px 64px -16px rgba(16,40,24,.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #eef0ec',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 17,
                            color: '#1f2d22',
                        }}
                    >
                        Nueva cita
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: 30,
                            height: 30,
                            border: 'none',
                            borderRadius: 8,
                            background: '#F3F7F2',
                            cursor: 'pointer',
                            fontSize: 16,
                        }}
                    >
                        ✕
                    </button>
                </div>
                <form
                    onSubmit={handleSubmit}
                    style={{
                        overflowY: 'auto',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                        }}
                    >
                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontWeight: 500,
                                fontSize: 14,
                            }}
                        >
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
                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontWeight: 500,
                                fontSize: 14,
                            }}
                        >
                            <span>Médico *</span>
                            <select
                                value={doctorId}
                                onChange={(e) => setDoctorId(e.target.value)}
                                style={{
                                    ...inputStyle,
                                    borderColor: errors.doctor_id
                                        ? '#b91c1c'
                                        : '#e4e4e7',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="">Seleccionar médico…</option>
                                {doctors.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} — {d.specialty}
                                    </option>
                                ))}
                            </select>
                            {errors.doctor_id && (
                                <span
                                    style={{ color: '#b91c1c', fontSize: 12 }}
                                >
                                    {errors.doctor_id}
                                </span>
                            )}
                        </label>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 12,
                            }}
                        >
                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    fontWeight: 500,
                                    fontSize: 14,
                                }}
                            >
                                <span>Fecha *</span>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    style={{
                                        ...inputStyle,
                                        borderColor: errors.appointment_date
                                            ? '#b91c1c'
                                            : '#e4e4e7',
                                    }}
                                />
                                {errors.appointment_date && (
                                    <span
                                        style={{
                                            color: '#b91c1c',
                                            fontSize: 12,
                                        }}
                                    >
                                        {errors.appointment_date}
                                    </span>
                                )}
                            </label>
                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    fontWeight: 500,
                                    fontSize: 14,
                                }}
                            >
                                <span>
                                    Hora{' '}
                                    <span
                                        style={{
                                            fontWeight: 400,
                                            color: '#71717a',
                                        }}
                                    >
                                        (opcional)
                                    </span>
                                </span>
                                <input
                                    type="time"
                                    value={hora}
                                    onChange={(e) => setHora(e.target.value)}
                                    style={inputStyle}
                                />
                            </label>
                        </div>
                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontWeight: 500,
                                fontSize: 14,
                            }}
                        >
                            <span>Tipo</span>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                                <option value="consulta">Consulta</option>
                                <option value="seguimiento">Seguimiento</option>
                                <option value="primera_vez">Primera vez</option>
                            </select>
                        </label>
                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontWeight: 500,
                                fontSize: 14,
                            }}
                        >
                            <span>
                                Notas{' '}
                                <span
                                    style={{
                                        fontWeight: 400,
                                        color: '#71717a',
                                    }}
                                >
                                    (opcional)
                                </span>
                            </span>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                rows={2}
                                placeholder="Motivo de consulta, indicaciones…"
                                style={{
                                    ...inputStyle,
                                    height: 'auto',
                                    padding: '8px 12px',
                                    resize: 'vertical',
                                    lineHeight: 1.5,
                                }}
                            />
                        </label>
                    </div>
                    <div
                        style={{
                            padding: '14px 20px',
                            borderTop: '1px solid #eef0ec',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 8,
                            flexShrink: 0,
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                height: 36,
                                padding: '0 14px',
                                borderRadius: 10,
                                border: '1px solid #dfe7df',
                                background: '#F6F9F5',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                height: 36,
                                padding: '0 16px',
                                borderRadius: 10,
                                border: 'none',
                                background: processing ? '#7cb987' : '#2E8B3E',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: processing ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            {processing ? 'Guardando…' : '✓ Registrar cita'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
