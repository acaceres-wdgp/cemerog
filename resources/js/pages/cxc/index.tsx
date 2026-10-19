import { useState } from 'react';

const MOCK_CXC = [
    { id: 1, paciente: 'Rosa Fernández', ini: 'RF', factura: 'F-0001230', total: 12400, abonado: 0, compromiso: '20/10/2026', nota: '' },
    { id: 2, paciente: 'Juan Pérez', ini: 'JP', factura: 'F-0001228', total: 3300, abonado: 1000, compromiso: '15/10/2026', nota: 'Pago parcial acordado' },
    { id: 3, paciente: 'Carmen López', ini: 'CL', factura: 'F-0001225', total: 18500, abonado: 5000, compromiso: '25/10/2026', nota: 'Internamiento activo' },
    { id: 4, paciente: 'Luis Martínez', ini: 'LM', factura: 'F-0001220', total: 1500, abonado: 0, compromiso: '14/10/2026', nota: '' },
];

const thStyle: React.CSSProperties = {
    textAlign: 'left', fontWeight: 600, fontSize: 11.5, letterSpacing: '.05em',
    textTransform: 'uppercase', color: '#56693f', padding: '0 12px', height: 40,
    background: '#F6FAF1', borderBottom: '1px solid #DCEBC9', whiteSpace: 'nowrap',
};

const fmt = (v: number) => `RD$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function CxcIndex() {
    const [selId, setSelId] = useState<number | null>(1);
    const [abonoAmt, setAbonoAmt] = useState('');
    const [abonoMetodo, setAbonoMetodo] = useState('efectivo');

    const selCuenta = MOCK_CXC.find(c => c.id === selId);
    const totalCxc = MOCK_CXC.reduce((s, c) => s + (c.total - c.abonado), 0);

    return (
        <div className="flex flex-col gap-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>Cuentas por cobrar</h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>Saldo total pendiente: <strong>{fmt(totalCxc)}</strong></p>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                {/* CxC table */}
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden', flex: '2 1 480px', minWidth: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Paciente</th>
                                    <th style={thStyle}>Factura</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Abonado</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Saldo</th>
                                    <th style={thStyle}>Compromiso</th>
                                    <th style={{ ...thStyle, width: 44 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_CXC.map(c => {
                                    const saldo = c.total - c.abonado;
                                    const vencida = new Date(c.compromiso.split('/').reverse().join('-')) < new Date();
                                    return (
                                        <tr key={c.id} onClick={() => setSelId(c.id)} style={{ cursor: 'pointer', background: selId === c.id ? '#F8FBF6' : '#fff' }}>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: '50%', background: '#EEF6E2', color: '#2E8B3E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{c.ini}</span>
                                                    <span style={{ fontWeight: 500 }}>{c.paciente}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.factura}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(c.total)}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#2E8B3E', fontWeight: 500 }}>{fmt(c.abonado)}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#b91c1c' }}>{fmt(saldo)}</td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', whiteSpace: 'nowrap' }}>
                                                <span style={{ color: vencida ? '#b91c1c' : '#1f2d22', fontWeight: vencida ? 600 : 400 }}>{c.compromiso}</span>
                                                {vencida && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, background: '#fef2f2', color: '#b91c1c', padding: '1px 6px', borderRadius: 999, marginLeft: 6, fontWeight: 600 }}>Vencida</span>}
                                            </td>
                                            <td style={{ padding: '12px', borderBottom: '1px solid #eef0ec', color: '#a1a1aa' }}>›</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Abono panel */}
                {selCuenta && (
                    <div style={{ flex: '1 1 280px', minWidth: 0, background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #eef0ec' }}>
                            <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Registrar abono</div>
                            <div style={{ fontSize: 13, color: '#71717a' }}>{selCuenta.paciente} · {selCuenta.factura}</div>
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                                <div style={{ padding: '10px 12px', borderRadius: 10, background: '#F3F7F2', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#56693f', textTransform: 'uppercase', letterSpacing: '.05em' }}>Total</span>
                                    <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(selCuenta.total)}</span>
                                </div>
                                <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '.05em' }}>Saldo</span>
                                    <span style={{ fontWeight: 700, color: '#b91c1c', fontVariantNumeric: 'tabular-nums' }}>{fmt(selCuenta.total - selCuenta.abonado)}</span>
                                </div>
                            </div>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                <span>Monto del abono</span>
                                <div style={{ display: 'flex', alignItems: 'center', height: 36, border: '1px solid #e4e4e7', borderRadius: 10 }}>
                                    <span style={{ padding: '0 10px', color: '#71717a', fontSize: 13 }}>RD$</span>
                                    <input value={abonoAmt} onChange={e => setAbonoAmt(e.target.value)} style={{ flex: 1, height: 34, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontVariantNumeric: 'tabular-nums' }} placeholder="0.00" />
                                </div>
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                <span>Método</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {[['efectivo', '💵 Efectivo'], ['tarjeta', '💳 Tarjeta'], ['transferencia', '🏦 Transfer.'], ['credito', '📝 Crédito']].map(([k, l]) => (
                                        <button key={k} onClick={() => setAbonoMetodo(k)} style={{ height: 34, borderRadius: 8, border: `1.5px solid ${abonoMetodo === k ? '#2E8B3E' : '#e4e4e7'}`, background: abonoMetodo === k ? '#EEF6E2' : '#fff', fontWeight: abonoMetodo === k ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>{l}</button>
                                    ))}
                                </div>
                            </div>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 13 }}>
                                <span>Nota (opcional)</span>
                                <input style={{ height: 34, padding: '0 10px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 13 }} placeholder="Observaciones del abono" />
                            </label>
                            <button style={{ height: 36, borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✓ Registrar abono</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
