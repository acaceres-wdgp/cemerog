/**
 * TurnoActualCard – sidebar card showing the doctor's current turn and queue.
 * Only rendered when the authenticated user has a linked doctor.
 * The queue comes with every page (shared prop); after «Llamar siguiente»
 * only the queue is reloaded.
 */

import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Stethoscope } from 'lucide-react';
import type { DoctorProp, QueueProp } from '@/types/global';

export interface TurnoActualCardProps {
    doctor: DoctorProp;
    queue: QueueProp | null | undefined;
    collapsed: boolean;
}

export function TurnoActualCard({
    doctor,
    queue,
    collapsed,
}: TurnoActualCardProps) {
    const [loading, setLoading] = useState(false);

    const handleCallNext = () => {
        setLoading(true);
        router.post(
            '/turnos/llamar-siguiente',
            {},
            {
                preserveScroll: true,
                onError: (errors: Record<string, string>) => {
                    if (errors.queue) {
                        toast.error(errors.queue);
                    }
                },
                onFinish: () => {
                    setLoading(false);
                    // Reload the queue after calling next
                    router.reload({ only: ['queue'] });
                },
            },
        );
    };

    const waitingCount = queue?.waiting_count ?? 0;
    const currentTurn = queue?.current_turn ?? null;

    // Collapsed: show icon + waiting badge only
    if (collapsed) {
        return (
            <div className="relative flex justify-center px-3 py-3">
                <div className="relative">
                    <Stethoscope className="h-5 w-5 text-white/60" />
                    {waitingCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-fg">
                            {waitingCount}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // Expanded: full card
    return (
        <div className="mx-3 mb-3 rounded-lg border border-white/10 bg-white/8 p-3">
            <div className="mb-2 flex items-center gap-2">
                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="text-[11px] font-semibold tracking-wider text-white/60 uppercase">
                    Turno actual
                </span>
            </div>

            {/* Loading state while queue is being fetched */}
            {queue === undefined ? (
                <p
                    className="mb-2 text-xs text-white/40"
                    data-testid="turno-loading"
                >
                    Cargando…
                </p>
            ) : (
                <>
                    {/* Current turn */}
                    <p className="mb-1 text-sm font-semibold text-white">
                        {currentTurn
                            ? `T-${String(currentTurn.turn_number).padStart(2, '0')}`
                            : 'Sin turno activo'}
                    </p>
                    {currentTurn && (
                        <p className="mb-2 truncate text-xs text-white/60">
                            {currentTurn.patient_name}
                        </p>
                    )}

                    {/* Waiting count + office */}
                    <p className="mb-2 text-xs text-white/50">
                        {waitingCount === 1
                            ? '1 paciente en espera'
                            : `${waitingCount} pacientes en espera`}
                        {doctor.office ? ` · ${doctor.office}` : ''}
                    </p>
                </>
            )}

            {/* Call next button */}
            <button
                onClick={handleCallNext}
                disabled={
                    loading ||
                    waitingCount === 0 ||
                    queue === undefined ||
                    currentTurn !== null
                }
                className="w-full rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
                {queue === undefined
                    ? 'Cargando…'
                    : currentTurn !== null
                      ? `En consulta: T-${String(currentTurn.turn_number).padStart(2, '0')}`
                      : waitingCount === 0
                        ? 'Sin pacientes en espera'
                        : 'Llamar siguiente'}
            </button>
        </div>
    );
}
