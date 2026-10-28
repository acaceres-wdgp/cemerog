import React from 'react';

// ─── Cuenta / Órdenes Tab ─────────────────────────────────────────────────────

export default function CuentaOrdenesTab() {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                gap: 16,
                alignItems: 'start',
            }}
        >
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
                        padding: '14px 18px',
                        fontFamily: 'Bitter,Georgia,serif',
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#1f2d22',
                    }}
                >
                    Órdenes
                </div>
                <div
                    style={{
                        padding: '20px',
                        color: '#71717a',
                        fontSize: 13,
                        textAlign: 'center',
                    }}
                >
                    No hay órdenes para esta consulta.
                </div>
            </div>
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
                        padding: '14px 18px',
                        fontFamily: 'Bitter,Georgia,serif',
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#1f2d22',
                    }}
                >
                    Cargos a la cuenta
                </div>
                <div
                    style={{
                        padding: '20px',
                        color: '#71717a',
                        fontSize: 13,
                        textAlign: 'center',
                    }}
                >
                    No hay cargos registrados.
                </div>
            </div>
        </div>
    );
}
