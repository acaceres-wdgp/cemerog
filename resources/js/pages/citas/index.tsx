import { useState } from 'react';

const DOCTORS = [
    { id: 1, ini: 'AR', nom: 'Dra. Ana Rodríguez', esp: 'Medicina general', abg: '#EEF6E2', afg: '#2E8B3E' },
    { id: 2, ini: 'PG', nom: 'Dr. Pedro Guzmán', esp: 'Cardiología', abg: '#DBEAFE', afg: '#1E40AF' },
    { id: 3, ini: 'SC', nom: 'Dra. Sofía Castro', esp: 'Pediatría', abg: '#EDE9FE', afg: '#5B21B6' },
];

const MOCK_CITAS: Record<string, { hora: string; paciente: string; motivo: string; tipo: string; estado: string; doc: number }[]> = {
    hoy: [
        { hora: '08:00', paciente: 'María García', motivo: 'Control ginecológico', tipo: 'Consulta', estado: 'Atendida', doc: 1 },
        { hora: '08:30', paciente: 'Ana Gómez', motivo: 'Control rutinario', tipo: 'Consulta', estado: 'Pendiente', doc: 1 },
        { hora: '09:00', paciente: 'Juan Pérez', motivo: 'Evaluación cardíaca', tipo: 'Consulta', estado: 'En lista', doc: 2 },
        { hora: '09:30', paciente: 'Pedro Díaz', motivo: 'Revisión eco', tipo: 'Consulta', estado: 'Confirmada', doc: 2 },
        { hora: '10:00', paciente: 'Luisa Torres', motivo: 'Vacuna niño 1 año', tipo: 'Consulta', estado: 'Confirmada', doc: 3 },
        { hora: '10:30', paciente: 'Carlos Reyes', motivo: 'Revisión tensión', tipo: 'Consulta', estado: 'Pendiente', doc: 1 },
        { hora: '11:00', paciente: 'Rosa Fernández', motivo: 'Seguimiento diabetes', tipo: 'Consulta', estado: 'Confirmada', doc: 1 },
        { hora: '14:00', paciente: 'Marta Caba', motivo: 'Primera consulta', tipo: 'Consulta', estado: 'Pendiente', doc: 2 },
    ],
    manana: [
        { hora: '08:00', paciente: 'Luis Martínez', motivo: 'Chequeo anual', tipo: 'Consulta', estado: 'Confirmada', doc: 1 },
        { hora: '09:00', paciente: 'Carmen López', motivo: 'Revisión medicamentos', tipo: 'Consulta', estado: 'Confirmada', doc: 1 },
        { hora: '10:00', paciente: 'Ana Torres', motivo: 'Evaluación cardiológica', tipo: 'Consulta', estado: 'Pendiente', doc: 2 },
        { hora: '11:00', paciente: 'Pepe García', motivo: 'Vacuna gripe', tipo: 'Consulta', estado: 'Pendiente', doc: 3 },
    ],
};

const ESTADO_COLORS: Record<string, { bg: string; fg: string }> = {
    'Atendida': { bg: '#DCFCE7', fg: '#166534' },
    'En lista': { bg: '#DBEAFE', fg: '#1E40AF' },
    'Confirmada': { bg: '#F3F7F2', fg: '#2E8B3E' },
    'Pendiente': { bg: '#FEF3C7', fg: '#92400E' },
    'No asistió': { bg: '#F4F4F5', fg: '#52525B' },
};

const thStyle: React.CSSProperties = {
    textAlign: 'left', fontWeight: 600, fontSize: 11.5, letterSpacing: '.05em',
    textTransform: 'uppercase', color: '#56693f', padding: '0 12px', height: 40,
    background: '#F6FAF1', borderBottom: '1px solid #DCEBC9', whiteSpace: 'nowrap',
};

export default function CitasIndex() {
    const [dayTab, setDayTab] = useState<'hoy' | 'manana'>('hoy');
    const [selDoc, setSelDoc] = useState<number | null>(null);

    const citas = MOCK_CITAS[dayTab];
    const filteredCitas = selDoc ? citas.filter(c => c.doc === selDoc) : citas;

    const SLOTS_HOY = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00'];

    return (
        <div className="flex flex-col gap-5">
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {DOCTORS.map(d => (
                        <button key={d.id} onClick={() => setSelDoc(selDoc === d.id ? null : d.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', background: selDoc === d.id ? '#EEF6E2' : '#fff', border: `1px solid ${selDoc === d.id ? '#B9DC8E' : '#e3e9e3'}`, fontFamily: 'inherit', fontSize: 14 }}>
                            <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: '50%', background: d.abg, color: d.afg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{d.ini}</span>
                            <span style={{ lineHeight: 1.2 }}>
                                <span style={{ display: 'block', fontWeight: 600, color: '#1f2d22', whiteSpace: 'nowrap' }}>{d.nom}</span>
                                <span style={{ display: 'block', fontSize: 12, color: '#71717a', whiteSpace: 'nowrap' }}>{d.esp}</span>
                            </span>
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'inline-flex', background: '#F3F7F2', border: '1px solid #e3e9e3', borderRadius: 11, padding: 3, gap: 2 }}>
                        {([{ key: 'hoy', label: 'Hoy', n: MOCK_CITAS.hoy.length }, { key: 'manana', label: 'Mañana', n: MOCK_CITAS.manana.length }] as const).map(t => (
                            <button key={t.key} onClick={() => setDayTab(t.key)} style={{ whiteSpace: 'nowrap', height: 30, padding: '0 12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 500, background: dayTab === t.key ? '#fff' : 'transparent', color: dayTab === t.key ? '#1f2d22' : '#52605a', boxShadow: dayTab === t.key ? '0 1px 3px rgba(0,0,0,.1)' : 'none', fontFamily: 'inherit', fontSize: 14 }}>
                                {t.label} <span style={{ color: '#8a948e', fontVariantNumeric: 'tabular-nums' }}>{t.n}</span>
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button style={{ width: 36, height: 36, border: '1px solid #dfe7df', background: '#F6F9F5', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}>‹</button>
                        <button style={{ height: 36, padding: '0 12px', border: '1px solid #dfe7df', background: '#F6F9F5', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500 }}>Hoy</button>
                        <button style={{ width: 36, height: 36, border: '1px solid #dfe7df', background: '#F6F9F5', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}>›</button>
                    </div>
                    <button style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                        + Nueva cita
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 17, color: '#1f2d22' }}>{dayTab === 'hoy' ? 'Lunes, 12 de octubre 2026' : 'Martes, 13 de octubre 2026'}</div>
                        <div style={{ fontSize: 13, color: '#71717a' }}>{filteredCitas.length} citas · {filteredCitas.filter(c => c.estado === 'Pendiente').length} pendientes de confirmar</div>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, paddingLeft: 20 }}>Hora</th>
                                <th style={thStyle}>Paciente</th>
                                <th style={thStyle}>Médico</th>
                                <th style={thStyle}>Tipo</th>
                                <th style={thStyle}>Estado</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SLOTS_HOY.map(slot => {
                                const cita = filteredCitas.find(c => c.hora === slot);
                                if (!cita) {
                                    return (
                                        <tr key={slot}>
                                            <td style={{ padding: '6px 12px 6px 20px', borderBottom: '1px solid #f1f3ef', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#8a948e', width: 60 }}>{slot}</td>
                                            <td colSpan={5} style={{ padding: '0 12px', borderBottom: '1px solid #f1f3ef', height: 44 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', height: '100%', borderRadius: 8, border: '1px dashed #d6e2d0', color: '#8a948e', cursor: 'pointer', fontSize: 13 }}>
                                                    + Disponible
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }
                                const doc = DOCTORS.find(d => d.id === cita.doc)!;
                                const stColor = ESTADO_COLORS[cita.estado] ?? { bg: '#F4F4F5', fg: '#52525B' };
                                return (
                                    <tr key={slot} style={{ background: cita.estado === 'Atendida' ? '#F8FBF6' : '#fff' }}>
                                        <td style={{ padding: '10px 12px 10px 20px', borderBottom: '1px solid #eef0ec', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: cita.estado === 'Atendida' ? '#8a948e' : '#1f2d22' }}>{slot}</td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec' }}>
                                            <div style={{ fontWeight: 500 }}>{cita.paciente}</div>
                                            <div style={{ fontSize: 12, color: '#71717a' }}>{cita.motivo}</div>
                                        </td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: '50%', background: doc.abg, color: doc.afg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{doc.ini}</span>
                                                <span style={{ fontSize: 13 }}>{doc.nom}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', color: '#52525b', fontSize: 13 }}>{cita.tipo}</td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: stColor.bg, color: stColor.fg }}>{cita.estado}</span>
                                        </td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', textAlign: 'right' }}>
                                            {cita.estado === 'Pendiente' && (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                                    <button style={{ height: 30, padding: '0 10px', borderRadius: 8, border: 'none', background: '#2E8B3E', color: '#fff', fontWeight: 500, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>+ Agregar a la lista</button>
                                                    <button style={{ height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid #dfe7df', background: '#F6F9F5', color: '#52525b', fontWeight: 500, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                                                </div>
                                            )}
                                            {cita.estado === 'En lista' && (
                                                <span style={{ fontSize: 12.5, color: '#2E8B3E', fontWeight: 500 }}>✓ En lista · T-05</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
