import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Props, TurnItem } from './types';
import QueueSelector from './components/QueueSelector';
import PatientHeader from './components/PatientHeader';
import NotaClinica from './components/NotaClinica';
import HistorialPanel from './components/HistorialPanel';
import RecetaTab from './components/RecetaTab';
import CuentaOrdenesTab from './components/CuentaOrdenesTab';
import ConsultaActions from './components/ConsultaActions';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConsultaIndex({
    turns_en_consulta,
    turns_en_espera,
    historial,
    historial_patient,
}: Props) {
    const [activeTurn, setActiveTurn] = useState<TurnItem | null>(
        turns_en_consulta[0] ?? null,
    );
    const [showQueue, setShowQueue] = useState(false);
    const [activeTab, setActiveTab] = useState<'nota' | 'receta' | 'cuenta'>(
        'nota',
    );

    const antecedents = historial_patient?.antecedents ?? null;
    const displayedHistorial = historial ?? [];

    return (
        <div className="flex flex-col gap-5">
            {/* Queue panel toggle + selector */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="m-0 font-serif text-[22px] font-bold text-text-heading">
                        Consulta
                    </h1>
                    <p className="m-0 text-[13px] text-muted">
                        {turns_en_consulta.length} en consulta ·{' '}
                        {turns_en_espera.length} en espera
                    </p>
                </div>
                <button
                    onClick={() => setShowQueue((v) => !v)}
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-sans text-sm font-medium"
                >
                    {showQueue ? '✕ Cerrar cola' : '☰ Ver cola de turnos'}
                </button>
            </div>

            {showQueue && (
                <div className="overflow-hidden rounded-[14px] border border-card-border bg-white">
                    <div className="border-b border-divider px-5 py-3 text-sm font-semibold">
                        Cola de pacientes – hoy
                    </div>
                    <QueueSelector
                        turnsEspera={turns_en_espera}
                        turnsConsulta={turns_en_consulta}
                        activeTurnId={activeTurn?.id ?? null}
                        onSelect={(t) => {
                            setActiveTurn(t);
                            setShowQueue(false);
                            router.get(
                                '/consulta',
                                { patient_id: String(t.patient.id) },
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                    only: ['historial', 'historial_patient'],
                                },
                            );
                        }}
                    />
                </div>
            )}

            {activeTurn ? (
                <>
                    {/* Patient header */}
                    <PatientHeader turn={activeTurn} />

                    {/* Action bar */}
                    <ConsultaActions
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        turnId={activeTurn.id}
                    />

                    {/* NOTA */}
                    {activeTab === 'nota' && (
                        <NotaClinica
                            key={activeTurn.patient.id}
                            turn={activeTurn}
                            antecedents={antecedents}
                            patientId={activeTurn.patient.id}
                        />
                    )}

                    {/* RECETA */}
                    {activeTab === 'receta' && <RecetaTab />}

                    {/* CUENTA */}
                    {activeTab === 'cuenta' && <CuentaOrdenesTab />}
                </>
            ) : (
                /* No active turn */
                <div className="rounded-2xl border border-card-border bg-white px-6 py-12 text-center">
                    <div className="mb-3 text-[40px]">🩺</div>
                    <div className="mb-2 font-serif text-[18px] font-semibold text-text-heading">
                        Sin paciente activo
                    </div>
                    <p className="m-0 mb-5 text-muted">
                        Selecciona un paciente de la cola de turnos para iniciar
                        la consulta.
                    </p>
                    <button
                        onClick={() => setShowQueue(true)}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-primary px-4 font-sans text-sm font-medium text-white"
                    >
                        ☰ Ver cola de turnos
                    </button>
                </div>
            )}

            {/* Historial clínico */}
            <HistorialPanel historial={displayedHistorial} />
        </div>
    );
}
