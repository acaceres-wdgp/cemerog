import React from 'react';
import { router } from '@inertiajs/react';

// ─── Consulta Actions (tabs + dar alta) ──────────────────────────────────────

const TABS = [
    { key: 'nota', label: 'Nota clínica' },
    { key: 'receta', label: 'Receta' },
    { key: 'cuenta', label: 'Cuenta / Órdenes' },
];

export default function ConsultaActions({
    activeTab,
    setActiveTab,
    turnId,
}: {
    activeTab: 'nota' | 'receta' | 'cuenta';
    setActiveTab: (tab: 'nota' | 'receta' | 'cuenta') => void;
    turnId: number;
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
            }}
        >
            <div
                style={{
                    display: 'inline-flex',
                    background: '#F3F7F2',
                    border: '1px solid #e3e9e3',
                    borderRadius: 11,
                    padding: 3,
                    gap: 2,
                }}
            >
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key as typeof activeTab)}
                        style={{
                            whiteSpace: 'nowrap',
                            height: 30,
                            padding: '0 12px',
                            border: 'none',
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontWeight: 500,
                            background:
                                activeTab === t.key ? '#fff' : 'transparent',
                            color: activeTab === t.key ? '#1f2d22' : '#52605a',
                            boxShadow:
                                activeTab === t.key
                                    ? '0 1px 3px rgba(0,0,0,.1)'
                                    : 'none',
                            fontFamily: 'inherit',
                            fontSize: 14,
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <button
                onClick={() =>
                    router.patch(`/consulta/turnos/${turnId}/alta`, {})
                }
                style={{
                    whiteSpace: 'nowrap',
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
                ✓ Dar alta
            </button>
        </div>
    );
}
