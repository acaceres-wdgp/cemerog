import { useState } from 'react';

const TEMAS = [
    { id: 'verde', nombre: 'Verde Clínica', primary: '#2E8B3E', accent: '#8CC63F', bg: '#F3F7F2', desc: 'Predeterminado' },
    { id: 'azul', nombre: 'Azul Médico', primary: '#1E40AF', accent: '#3B82F6', bg: '#EFF6FF', desc: 'Alternativo' },
    { id: 'violeta', nombre: 'Violeta Salud', primary: '#5B21B6', accent: '#7C3AED', bg: '#F5F3FF', desc: 'Alternativo' },
    { id: 'rojo', nombre: 'Rojo Emergencia', primary: '#B91C1C', accent: '#DC2626', bg: '#FEF2F2', desc: 'Alternativo' },
    { id: 'gris', nombre: 'Gris Neutral', primary: '#374151', accent: '#6B7280', bg: '#F9FAFB', desc: 'Alternativo' },
];

const ATTENTION_STATES = [
    { key: 'en_espera', label: 'En espera', bg: '#F3F7F2', border: '#B9DC8E', fg: '#2E8B3E' },
    { key: 'en_consulta', label: 'En consulta', bg: '#DBEAFE', border: '#93C5FD', fg: '#1E40AF' },
    { key: 'atendido', label: 'Atendido', bg: '#D1FAE5', border: '#6EE7B7', fg: '#065F46' },
    { key: 'pendiente_lab', label: 'Pendiente lab.', bg: '#FEF3C7', border: '#FCD34D', fg: '#92400E' },
    { key: 'pendiente_img', label: 'Pendiente img.', bg: '#FEF3C7', border: '#FCD34D', fg: '#78350F' },
    { key: 'pendiente_pago', label: 'Pendiente pago', bg: '#FCE7F3', border: '#F9A8D4', fg: '#9D174D' },
    { key: 'en_internamiento', label: 'Internado', bg: '#EDE9FE', border: '#C4B5FD', fg: '#5B21B6' },
    { key: 'emergencia', label: 'Emergencia', bg: '#FEE2E2', border: '#FCA5A5', fg: '#991B1B' },
    { key: 'cancelado', label: 'Cancelado', bg: '#F4F4F5', border: '#D4D4D8', fg: '#52525B' },
];

const TRIAGE_LEVELS = [
    { level: 'I', nombre: 'Reanimación', bg: '#7F1D1D', fg: '#fff', desc: 'Riesgo vital inmediato' },
    { level: 'II', nombre: 'Emergencia', bg: '#EF4444', fg: '#fff', desc: 'Riesgo vital potencial' },
    { level: 'III', nombre: 'Urgencia', bg: '#F59E0B', fg: '#fff', desc: 'Urgencia moderada' },
    { level: 'IV', nombre: 'Menor', bg: '#22C55E', fg: '#fff', desc: 'Urgencia menor' },
    { level: 'V', nombre: 'Sin urgencia', bg: '#6B7280', fg: '#fff', desc: 'No urgente' },
];

export default function TemaIndex() {
    const [selTema, setSelTema] = useState('verde');
    const tema = TEMAS.find(t => t.id === selTema)!;

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>Tema y Estados</h1>
                <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>Personaliza los colores de la interfaz y revisa los estados del sistema</p>
            </div>

            {/* Theme selector */}
            <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, padding: '20px' }}>
                <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22', marginBottom: 16 }}>Esquema de color</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {TEMAS.map(t => (
                        <button key={t.id} onClick={() => setSelTema(t.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 20px', borderRadius: 12, border: `2px solid ${selTema === t.id ? t.primary : '#e3e9e3'}`, background: selTema === t.id ? t.bg : '#FAFAFA', cursor: 'pointer', fontFamily: 'inherit', minWidth: 110, transition: 'border-color .15s, background .15s' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <span style={{ width: 24, height: 24, borderRadius: '50%', background: t.primary, display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }}></span>
                                <span style={{ width: 24, height: 24, borderRadius: '50%', background: t.accent, display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }}></span>
                                <span style={{ width: 24, height: 24, borderRadius: '50%', background: t.bg, display: 'block', border: '1px solid #ddd' }}></span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 13, fontWeight: selTema === t.id ? 700 : 500, color: '#1f2d22' }}>{t.nombre}</div>
                                <div style={{ fontSize: 11, color: selTema === t.id ? t.primary : '#71717a', marginTop: 1 }}>{t.desc}</div>
                            </div>
                            {selTema === t.id && (
                                <span style={{ width: 20, height: 20, borderRadius: '50%', background: t.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Preview bar */}
                <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 10, background: tema.bg, border: `1px solid ${tema.primary}30` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: tema.primary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Vista previa: {tema.nombre}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button style={{ height: 34, padding: '0 16px', borderRadius: 8, border: 'none', background: tema.primary, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Botón principal</button>
                        <button style={{ height: 34, padding: '0 16px', borderRadius: 8, border: `1px solid ${tema.primary}40`, background: '#fff', color: tema.primary, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Botón secundario</button>
                        <span style={{ padding: '4px 12px', borderRadius: 999, background: tema.accent + '25', color: tema.primary, fontSize: 12, fontWeight: 600 }}>Etiqueta</span>
                        <div style={{ height: 6, flex: 1, minWidth: 80, borderRadius: 999, background: tema.primary + '20', overflow: 'hidden' }}>
                            <div style={{ width: '65%', height: '100%', background: tema.primary, borderRadius: 999 }}></div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button style={{ height: 36, padding: '0 16px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancelar</button>
                    <button style={{ height: 36, padding: '0 16px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✓ Aplicar tema</button>
                </div>
            </div>

            {/* Attention states reference */}
            <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, padding: '20px' }}>
                <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22', marginBottom: 4 }}>Estados de atención</div>
                <div style={{ fontSize: 13, color: '#5f6b64', marginBottom: 16 }}>Los 9 estados que puede tener una atención en el sistema</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ATTENTION_STATES.map(s => (
                        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, border: `1px solid ${s.border}`, background: s.bg }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.fg, flexShrink: 0 }}></span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: s.fg }}>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Triage levels reference */}
            <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, padding: '20px' }}>
                <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22', marginBottom: 4 }}>Niveles de triage (Manchester)</div>
                <div style={{ fontSize: 13, color: '#5f6b64', marginBottom: 16 }}>Escala de prioridad de atención para urgencias y emergencias</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {TRIAGE_LEVELS.map(t => (
                        <div key={t.level} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: t.bg, minWidth: 180, flex: '1 1 160px' }}>
                            <span style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,.2)', color: t.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0, fontFamily: 'Bitter,Georgia,serif' }}>{t.level}</span>
                            <div>
                                <div style={{ color: t.fg, fontWeight: 700, fontSize: 14 }}>{t.nombre}</div>
                                <div style={{ color: t.fg, fontSize: 11.5, opacity: 0.85, marginTop: 1 }}>{t.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Color tokens reference */}
            <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, padding: '20px' }}>
                <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22', marginBottom: 4 }}>Tokens de diseño</div>
                <div style={{ fontSize: 13, color: '#5f6b64', marginBottom: 16 }}>Paleta de colores base del sistema</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
                    {[
                        { name: 'Primary', value: '#2E8B3E' },
                        { name: 'Accent', value: '#8CC63F' },
                        { name: 'Background', value: '#F3F7F2' },
                        { name: 'Surface', value: '#FFFFFF' },
                        { name: 'Border', value: '#DCEBC9' },
                        { name: 'Text primary', value: '#1f2d22' },
                        { name: 'Text muted', value: '#5f6b64' },
                        { name: 'Danger', value: '#B91C1C' },
                        { name: 'Warning', value: '#D97706' },
                        { name: 'Info', value: '#1E40AF' },
                    ].map(c => (
                        <div key={c.name} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e3e9e3' }}>
                            <div style={{ height: 48, background: c.value }}></div>
                            <div style={{ padding: '8px 10px' }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2d22' }}>{c.name}</div>
                                <div style={{ fontSize: 11, fontFamily: 'ui-monospace,monospace', color: '#71717a', marginTop: 2 }}>{c.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
