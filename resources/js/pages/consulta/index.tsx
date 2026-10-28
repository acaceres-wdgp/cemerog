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
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                }}
            >
                <div>
                    <h1
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 700,
                            fontSize: 22,
                            color: '#1f2d22',
                            margin: 0,
                        }}
                    >
                        Consulta
                    </h1>
                    <p style={{ margin: 0, fontSize: 13, color: '#71717a' }}>
                        {turns_en_consulta.length} en consulta ·{' '}
                        {turns_en_espera.length} en espera
                    </p>
                </div>
                <button
                    onClick={() => setShowQueue((v) => !v)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
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
                    {showQueue ? '✕ Cerrar cola' : '☰ Ver cola de turnos'}
                </button>
            </div>

            {showQueue && (
                <div
                    style={{
                        background: '#fff',
                        border: '1px solid #e3e9e3',
                        borderRadius: 14,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            padding: '12px 20px',
                            borderBottom: '1px solid #eef0ec',
                            fontWeight: 600,
                            fontSize: 14,
                        }}
                    >
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
                <div
                    style={{
                        background: '#fff',
                        border: '1px solid #e3e9e3',
                        borderRadius: 16,
                        padding: '48px 24px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🩺</div>
                    <div
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 18,
                            color: '#1f2d22',
                            marginBottom: 8,
                        }}
                    >
                        Sin paciente activo
                    </div>
                    <p style={{ color: '#71717a', margin: '0 0 20px' }}>
                        Selecciona un paciente de la cola de turnos para iniciar
                        la consulta.
                    </p>
                    <button
                        onClick={() => setShowQueue(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 36,
                            padding: '0 16px',
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
                        ☰ Ver cola de turnos
                    </button>
                </div>
            )}

            {/* Historial clínico */}
            <HistorialPanel historial={displayedHistorial} />
        </div>
    );
}
