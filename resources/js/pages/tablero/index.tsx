import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
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
            {
                preserveScroll: true,
                onError: (errors: Record<string, string>) => {
                    if (errors.open_turn) {
                        toast.error(errors.open_turn);
                    }
                },
            },
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
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold text-text-heading">
                        Tablero de atenciones
                    </h1>
                    <p className="mt-1 text-text-secondary">
                        Pacientes en la clínica y su estado actual.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {nextTurn && (
                        <div className="flex h-9 items-center gap-2 rounded-[10px] border border-input-border px-3 text-[13px]">
                            <span className="text-muted">Siguiente</span>
                            <strong className="text-[15px] tabular-nums">
                                T-
                                {String(nextTurn.turn_number).padStart(2, '0')}
                            </strong>
                        </div>
                    )}
                    <button
                        onClick={() => setShowWalkIn(true)}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-primary px-[14px] font-[inherit] text-sm font-medium whitespace-nowrap text-white"
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
