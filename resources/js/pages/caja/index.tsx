import { useState } from 'react';
import StatusBadge from '@/components/cemerog/StatusBadge';

const CARGOS = [
    { desc: 'Consulta medicina general', cant: 1, precio: 1500 },
    { desc: 'Uroanálisis', cant: 1, precio: 600 },
    { desc: 'Urocultivo', cant: 1, precio: 1200 },
];

const METODOS = [
    { key: 'efectivo', label: 'Efectivo', icon: '💵' },
    { key: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { key: 'transferencia', label: 'Transferencia', icon: '🏦' },
    { key: 'credito', label: 'Crédito', icon: '📝' },
];

const MOCK_QUEUE = [
    { no: 'A-MG01-000234', paciente: 'María García', ini: 'MG', total: 'RD$3,300.00', estado: 'pendiente' as const },
    { no: 'A-MG01-000237', paciente: 'Luis Martínez', ini: 'LM', total: 'RD$1,500.00', estado: 'pendiente' as const },
    { no: 'A-MG01-000235', paciente: 'Juan Pérez', ini: 'JP', total: 'RD$2,700.00', estado: 'saldada' as const },
];

export default function CajaIndex() {
    const [selPt, setSelPt] = useState(MOCK_QUEUE[0]);
    const [metodo, setMetodo] = useState('efectivo');
    const [abono, setAbono] = useState('');
    const [fechaCompromiso, setFechaCompromiso] = useState('');
    const [notaCredito, setNotaCredito] = useState('');

    const total = CARGOS.reduce((s, c) => s + c.precio * c.cant, 0);
    const fmt = (v: number) => `RD$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    return (
        <div className="flex flex-col gap-5">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>Caja</h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>Registro y cobro de atenciones</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                {/* Queue */}
                <div style={{ flex: '0 0 280px', minWidth: 240, background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #eef0ec', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 15, color: '#1f2d22' }}>Cola de cobro</div>
                    {MOCK_QUEUE.map(q => (
                        <div key={q.no} onClick={() => setSelPt(q)} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f3ef', cursor: 'pointer', background: selPt.no === q.no ? '#F8FBF6' : '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: '50%', background: '#EEF6E2', color: '#2E8B3E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{q.ini}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 500, fontSize: 13 }}>{q.paciente}</div>
                                <div style={{ fontSize: 12, color: '#71717a', fontVariantNumeric: 'tabular-nums' }}>{q.total}</div>
                            </div>
                            <StatusBadge state={q.estado} />
                        </div>
                    ))}
                </div>

                {/* Cuenta detail */}
                <div style={{ flex: '1 1 400px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid #eef0ec' }}>
                            <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Cuenta · {selPt.paciente}</div>
                            <div style={{ fontSize: 13, color: '#71717a' }}>No. {selPt.no}</div>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Descripción', 'Cant.', 'Precio', 'Total'].map(h => (
                                        <th key={h} style={{ textAlign: h === 'Descripción' ? 'left' : 'right', fontWeight: 600, fontSize: 11.5, letterSpacing: '.05em', textTransform: 'uppercase', color: '#56693f', padding: h === 'Descripción' ? '0 18px' : '0 12px', height: 40, background: '#F6FAF1', borderBottom: '1px solid #DCEBC9' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {CARGOS.map((c, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '10px 18px', borderBottom: '1px solid #eef0ec' }}>{c.desc}</td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', textAlign: 'right' }}>{c.cant}</td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(c.precio)}</td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{fmt(c.precio * c.cant)}</td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={3} style={{ padding: '12px 18px', fontWeight: 700, fontSize: 15 }}>Total</td>
                                    <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Payment */}
                    <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14 }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid #eef0ec', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Registrar pago</div>
                        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <div style={{ fontWeight: 500, marginBottom: 10, fontSize: 14 }}>Método de pago</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8 }}>
                                    {METODOS.map(m => (
                                        <button key={m.key} onClick={() => setMetodo(m.key)} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${metodo === m.key ? '#2E8B3E' : '#e4e4e7'}`, background: metodo === m.key ? '#EEF6E2' : '#fff', fontFamily: 'inherit', fontSize: 14 }}>
                                            <span style={{ fontSize: 18 }}>{m.icon}</span>
                                            <span style={{ fontWeight: metodo === m.key ? 600 : 400 }}>{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {metodo !== 'credito' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 14 }}>
                                        <span>Monto pagado</span>
                                        <div style={{ display: 'flex', alignItems: 'center', height: 36, border: '1px solid #e4e4e7', borderRadius: 10 }}>
                                            <span style={{ padding: '0 10px', color: '#71717a', fontSize: 13 }}>RD$</span>
                                            <input defaultValue={total.toFixed(2)} style={{ flex: 1, height: 34, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontVariantNumeric: 'tabular-nums' }} />
                                        </div>
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <span style={{ fontWeight: 500, fontSize: 14 }}>Cambio</span>
                                        <div style={{ height: 36, padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: 10, display: 'flex', alignItems: 'center', background: '#F3F7F2', fontVariantNumeric: 'tabular-nums', color: '#1f2d22', fontWeight: 600 }}>
                                            RD$0.00
                                        </div>
                                    </div>
                                </div>
                            )}

                            {metodo === 'credito' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid #e4e4e7', background: '#fafafa' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 13 }}>
                                            <span>Abono inicial (opcional)</span>
                                            <div style={{ display: 'flex', alignItems: 'center', height: 34, border: '1px solid #e4e4e7', borderRadius: 10, background: '#fff' }}>
                                                <span style={{ padding: '0 8px', color: '#71717a', fontSize: 12 }}>RD$</span>
                                                <input value={abono} onChange={e => setAbono(e.target.value)} style={{ flex: 1, height: 32, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13 }} placeholder="0.00" />
                                            </div>
                                        </label>
                                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 13 }}>
                                            <span>Fecha compromiso</span>
                                            <input type="date" value={fechaCompromiso} onChange={e => setFechaCompromiso(e.target.value)} style={{ height: 34, padding: '0 10px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 13, background: '#fff' }} />
                                        </label>
                                    </div>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 500, fontSize: 13 }}>
                                        <span>Nota</span>
                                        <input value={notaCredito} onChange={e => setNotaCredito(e.target.value)} style={{ height: 34, padding: '0 10px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', fontFamily: 'inherit', fontSize: 13, background: '#fff' }} placeholder="Motivo del crédito…" />
                                    </label>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancelar</button>
                                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 16px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                                    ✓ Cobrar {fmt(total)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
