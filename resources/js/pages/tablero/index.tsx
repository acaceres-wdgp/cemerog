import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { TurnRow, CitaRow, DoctorOption } from './types';
import { StatCards } from './components/StatCards';
import { TurnosPanel } from './components/TurnosPanel';
import { CitasHoyPanel } from './components/CitasHoyPanel';
import { AgregarTurnoModal } from './components/AgregarTurnoModal';

type Props = {
    turns: TurnRow[];
    appointments: CitaRow[];
    doctors: DoctorOption[];
    en_espera: number;
};

export default function TableroIndex({ turns, appointments, doctors }: Props) {
    const [activeTab, setActiveTab] = useState('todas');
    const [citaTab, setCitaTab] = useState('pendientes');
    const [showWalkIn, setShowWalkIn] = useState(false);

    function assignTurnFromCita(cita: CitaRow) {
        router.post(
            '/tablero/turnos',
            {
                patient_id: cita.patient_id,
                doctor_id: cita.doctor_id,
                appointment_id: cita.id,
            },
            { preserveScroll: true },
        );
    }

    function markNoShow(cita: CitaRow) {
        if (
            !confirm(`¿Marcar la cita de ${cita.patient_name} como no asistió?`)
        )
            return;
        router.patch(
            `/citas/${cita.id}/status`,
            { status: 'no_asistio' },
            { preserveScroll: true },
        );
    }

    function patchTurnStatus(id: number, status: string) {
        router.patch(
            `/tablero/turnos/${id}/status`,
            { status },
            { preserveScroll: true },
        );
    }

    function reorderTurn(id: number, direction: 'up' | 'down') {
        router.patch(
            `/tablero/turnos/${id}/reorder`,
            { direction },
            { preserveScroll: true },
        );
    }

    const nextTurn = turns.find((t) => t.status === 'espera');

    return (
        <div className="flex flex-col gap-5">
            {/* ── Header ── */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontFamily: 'Bitter,Georgia,serif',
                            fontSize: 28,
                            fontWeight: 600,
                            color: '#1f2d22',
                            lineHeight: 1.2,
                        }}
                    >
                        Tablero de atenciones
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                        Pacientes en la clínica y su estado actual.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {nextTurn && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                height: 36,
                                padding: '0 12px',
                                border: '1px solid #e4e4e7',
                                borderRadius: 10,
                                fontSize: 13,
                            }}
                        >
                            <span style={{ color: '#71717a' }}>Siguiente</span>
                            <strong
                                style={{
                                    fontSize: 15,
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                T-
                                {String(nextTurn.turn_number).padStart(2, '0')}
                            </strong>
                        </div>
                    )}
                    <button
                        onClick={() => setShowWalkIn(true)}
                        style={{
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 36,
                            padding: '0 14px',
                            borderRadius: 10,
                            border: 'none',
                            background: '#2E8B3E',
                            color: '#fff',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 14,
                        }}
                    >
                        + Agregar turno
                    </button>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <StatCards turns={turns} />

            {/* ── Atenciones (turnos activos) ── */}
            <TurnosPanel
                turns={turns}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onPatchStatus={patchTurnStatus}
                onReorder={reorderTurn}
            />

            {/* ── Citas de hoy ── */}
            <CitasHoyPanel
                appointments={appointments}
                doctors={doctors}
                citaTab={citaTab}
                onCitaTabChange={setCitaTab}
                onAssign={assignTurnFromCita}
                onNoShow={markNoShow}
            />

            {/* ── Modal walk-in ── */}
            {showWalkIn && (
                <AgregarTurnoModal
                    onClose={() => setShowWalkIn(false)}
                    doctors={doctors}
                />
            )}
        </div>
    );
}
