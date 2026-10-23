import { useState } from 'react';

const CAJEROS = ['Kenia Marte', 'Juan Mateo', 'Rosa Castillo'];
const TURNOS = [
    'Mañana (08:00 – 14:00)',
    'Tarde (14:00 – 20:00)',
    'Noche (20:00 – 08:00)',
];

const METODOS_CUADRE = [
    { metodo: 'Efectivo', esperado: 18500, contado: 18200, dif: -300 },
    { metodo: 'Tarjeta de débito', esperado: 12400, contado: 12400, dif: 0 },
    { metodo: 'Tarjeta de crédito', esperado: 8600, contado: 8600, dif: 0 },
    { metodo: 'Transferencia', esperado: 5000, contado: 5000, dif: 0 },
    { metodo: 'Crédito (pendiente)', esperado: 3300, contado: 0, dif: -3300 },
];

const fmt = (v: number) =>
    `RD$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const thStyle: React.CSSProperties = {
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 11.5,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    color: '#56693f',
    padding: '0 16px',
    height: 40,
    background: '#F6FAF1',
    borderBottom: '1px solid #DCEBC9',
    whiteSpace: 'nowrap',
};

export default function CuadreIndex() {
    const [cajero] = useState(CAJEROS[0]);
    const [turno] = useState(TURNOS[0]);
    const [confirmed, setConfirmed] = useState(false);

    const totalEsp = METODOS_CUADRE.reduce((s, m) => s + m.esperado, 0);
    const totalCon = METODOS_CUADRE.reduce((s, m) => s + m.contado, 0);
    const totalDif = totalCon - totalEsp;

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h1
                    style={{
                        fontFamily: 'Bitter,Georgia,serif',
                        fontWeight: 600,
                        fontSize: 26,
                        color: '#1f2d22',
                        margin: 0,
                    }}
                >
                    Cuadre de caja
                </h1>
                <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                    Cierre y cuadre del turno de caja · 12/10/2026
                </p>
            </div>

            {/* Selector */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 14,
                    padding: '16px 20px',
                    display: 'flex',
                    gap: 20,
                    flexWrap: 'wrap',
                    alignItems: 'flex-end',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        flex: '1 1 200px',
                    }}
                >
                    <span style={{ fontWeight: 500, fontSize: 14 }}>
                        Cajero
                    </span>
                    <div
                        style={{
                            height: 36,
                            padding: '0 12px',
                            border: '1px solid #e4e4e7',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            fontSize: 14,
                        }}
                    >
                        {cajero} <span>▾</span>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        flex: '1 1 240px',
                    }}
                >
                    <span style={{ fontWeight: 500, fontSize: 14 }}>Turno</span>
                    <div
                        style={{
                            height: 36,
                            padding: '0 12px',
                            border: '1px solid #e4e4e7',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            fontSize: 14,
                        }}
                    >
                        {turno} <span>▾</span>
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
                    gap: 12,
                }}
            >
                {[
                    {
                        label: 'Total esperado',
                        val: fmt(totalEsp),
                        color: '#1f2d22',
                    },
                    {
                        label: 'Total contado',
                        val: fmt(totalCon),
                        color: '#1f2d22',
                    },
                    {
                        label: 'Diferencia',
                        val: `${totalDif >= 0 ? '+' : '-'}${fmt(totalDif)}`,
                        color: totalDif < 0 ? '#b91c1c' : '#2E8B3E',
                    },
                    { label: 'Facturas emitidas', val: '18', color: '#1f2d22' },
                ].map((k) => (
                    <div
                        key={k.label}
                        style={{
                            background: '#fff',
                            border: '1px solid #e3e9e3',
                            borderRadius: 14,
                            padding: '16px 18px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11.5,
                                fontWeight: 600,
                                color: '#56693f',
                                textTransform: 'uppercase',
                                letterSpacing: '.06em',
                                marginBottom: 6,
                            }}
                        >
                            {k.label}
                        </div>
                        <div
                            style={{
                                fontFamily: 'Bitter,Georgia,serif',
                                fontSize: 22,
                                fontWeight: 700,
                                color: k.color,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {k.val}
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail table */}
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
                        padding: '14px 20px',
                        borderBottom: '1px solid #eef0ec',
                        fontFamily: 'Bitter,Georgia,serif',
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#1f2d22',
                    }}
                >
                    Detalle por método de pago
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table
                        style={{ width: '100%', borderCollapse: 'collapse' }}
                    >
                        <thead>
                            <tr>
                                <th style={thStyle}>Método de pago</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>
                                    Esperado
                                </th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>
                                    Contado
                                </th>
                                <th
                                    style={{
                                        ...thStyle,
                                        textAlign: 'right',
                                        paddingRight: 20,
                                    }}
                                >
                                    Diferencia
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {METODOS_CUADRE.map((m, i) => (
                                <tr key={i}>
                                    <td
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #eef0ec',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {m.metodo}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #eef0ec',
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {fmt(m.esperado)}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #eef0ec',
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        <input
                                            defaultValue={m.contado.toFixed(2)}
                                            style={{
                                                textAlign: 'right',
                                                width: 120,
                                                height: 30,
                                                padding: '0 8px',
                                                border: '1px solid #e4e4e7',
                                                borderRadius: 8,
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: 13,
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                            }}
                                        />
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px 20px 12px 16px',
                                            borderBottom: '1px solid #eef0ec',
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                            fontWeight: 600,
                                            color:
                                                m.dif === 0
                                                    ? '#2E8B3E'
                                                    : '#b91c1c',
                                        }}
                                    >
                                        {m.dif === 0
                                            ? '—'
                                            : `${m.dif > 0 ? '+' : '-'}${fmt(m.dif)}`}
                                    </td>
                                </tr>
                            ))}
                            <tr style={{ background: '#F6FAF1' }}>
                                <td
                                    style={{
                                        padding: '12px 16px',
                                        fontWeight: 700,
                                    }}
                                >
                                    Total
                                </td>
                                <td
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'right',
                                        fontWeight: 700,
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    {fmt(totalEsp)}
                                </td>
                                <td
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'right',
                                        fontWeight: 700,
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    {fmt(totalCon)}
                                </td>
                                <td
                                    style={{
                                        padding: '12px 20px 12px 16px',
                                        textAlign: 'right',
                                        fontWeight: 700,
                                        fontVariantNumeric: 'tabular-nums',
                                        color:
                                            totalDif < 0
                                                ? '#b91c1c'
                                                : '#2E8B3E',
                                    }}
                                >
                                    {totalDif === 0
                                        ? '—'
                                        : `${totalDif > 0 ? '+' : '-'}${fmt(totalDif)}`}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {totalDif < 0 && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#b91c1c',
                    }}
                >
                    <span style={{ fontSize: 18 }}>⚠</span>
                    <div>
                        <div style={{ fontWeight: 600 }}>
                            Hay una diferencia de {fmt(Math.abs(totalDif))}
                        </div>
                        <div style={{ fontSize: 13 }}>
                            Verifica el conteo antes de cerrar el turno. Una
                            diferencia en efectivo puede indicar un error en el
                            conteo o una transacción no registrada.
                        </div>
                    </div>
                </div>
            )}

            <label
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    fontWeight: 500,
                    fontSize: 14,
                }}
            >
                <span>Observaciones</span>
                <textarea
                    rows={2}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #e4e4e7',
                        borderRadius: 10,
                        outline: 'none',
                        fontFamily: 'inherit',
                        fontSize: 14,
                    }}
                    placeholder="Notas del turno…"
                ></textarea>
            </label>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        fontSize: 14,
                    }}
                >
                    <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    Confirmo que el conteo fue realizado correctamente
                </label>
            </div>

            <div
                style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
            >
                <button
                    style={{
                        height: 36,
                        padding: '0 16px',
                        borderRadius: 10,
                        border: '1px solid #dfe7df',
                        background: '#F6F9F5',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 14,
                    }}
                >
                    Guardar borrador
                </button>
                <button
                    disabled={!confirmed}
                    style={{
                        height: 36,
                        padding: '0 16px',
                        borderRadius: 10,
                        border: 'none',
                        background: confirmed ? '#2E8B3E' : '#a1a1aa',
                        color: '#fff',
                        fontWeight: 500,
                        cursor: confirmed ? 'pointer' : 'not-allowed',
                        fontFamily: 'inherit',
                        fontSize: 14,
                    }}
                >
                    🔒 Cerrar turno
                </button>
            </div>
        </div>
    );
}
