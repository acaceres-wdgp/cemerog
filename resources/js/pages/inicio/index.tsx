import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { Activity, Clock, DollarSign, Users } from 'lucide-react';
import StatCard from '@/components/cemerog/StatCard';
import StatusBadge from '@/components/cemerog/StatusBadge';
import { useCan } from '@/hooks/use-can';
import { caja, citas, lab, registro, tablero } from '@/routes';

const MOCK_ATENCIONES = [
    { no: 'A-MG01-000234', paciente: 'María García', edad: 42, estado: 'consulta' as const, medico: 'Dra. Ana Rodríguez', hora: '08:15', motivo: 'Control ginecológico' },
    { no: 'A-MG01-000235', paciente: 'Juan Pérez', edad: 28, estado: 'espera' as const, medico: 'Dr. Pedro Guzmán', hora: '08:42', motivo: 'Dolor de pecho' },
    { no: 'A-MG01-000236', paciente: 'Carmen López', edad: 67, estado: 'internado' as const, medico: 'Dra. Ana Rodríguez', hora: '07:30', motivo: 'Neumonía bacteriana' },
    { no: 'A-MG01-000237', paciente: 'Luis Martínez', edad: 35, estado: 'pendiente' as const, medico: 'Dr. Pedro Guzmán', hora: '09:05', motivo: 'Chequeo rutinario' },
    { no: 'A-MG01-000238', paciente: 'Rosa Fernández', edad: 55, estado: 'balance' as const, medico: 'Dra. Sofía Castro', hora: '09:20', motivo: 'Seguimiento diabetes' },
];

const MOCK_CITAS = [
    { hora: '10:00', paciente: 'Ana Gómez', medico: 'Dra. Ana Rodríguez', tipo: 'Medicina general', estado: 'Pendiente' },
    { hora: '10:30', paciente: 'Pedro Díaz', medico: 'Dr. Pedro Guzmán', tipo: 'Cardiología', estado: 'Confirmada' },
    { hora: '11:00', paciente: 'Luisa Torres', medico: 'Dra. Sofía Castro', tipo: 'Pediatría', estado: 'Confirmada' },
    { hora: '11:30', paciente: 'Carlos Reyes', medico: 'Dra. Ana Rodríguez', tipo: 'Medicina general', estado: 'Pendiente' },
];

const thStyle: React.CSSProperties = {
    textAlign: 'left', fontWeight: 600, fontSize: 11.5, letterSpacing: '.05em',
    textTransform: 'uppercase', color: '#56693f', padding: '0 12px', height: 40,
    background: '#F6FAF1', borderBottom: '1px solid #DCEBC9', whiteSpace: 'nowrap',
};

export default function InicioIndex() {
    const [activeRole] = useState<'admin'>('admin');
    const can = useCan();

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>
                        Buenos días, Admin
                    </h1>
                    <p style={{ color: '#5f6b64', margin: '4px 0 0' }}>Resumen del día · lunes, 12/10/2026</p>
                </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                <StatCard label="Atenciones hoy" value="18" icon={Users} trend={{ value: 12, label: 'vs ayer' }} />
                <StatCard label="En espera" value="4" icon={Clock} />
                <StatCard label="Facturado hoy" value="RD$34,500.00" icon={DollarSign} trend={{ value: 8, label: 'vs ayer' }} />
                <StatCard label="Pendiente de cobro" value="RD$12,200.00" icon={Activity} />
            </div>

            {/* Cards row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                {/* Últimas atenciones */}
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, flex: '1 1 420px', minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Últimas atenciones del día</span>
                        {can('module.tablero.access') && (
                            <Link href={tablero()} style={{ color: '#2E8B3E', fontWeight: 500, fontSize: 13 }}>Ver tablero →</Link>
                        )}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>No. atención</th>
                                    <th style={thStyle}>Paciente</th>
                                    <th style={thStyle}>Médico</th>
                                    <th style={thStyle}>Hora</th>
                                    <th style={thStyle}>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_ATENCIONES.map((a) => (
                                    <tr key={a.no} style={{ cursor: 'pointer' }}>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', fontFamily: 'ui-monospace,monospace', fontSize: 13, fontWeight: 600, color: '#1f2d22', whiteSpace: 'nowrap' }}>{a.no}</td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec' }}>
                                            <div style={{ fontWeight: 500 }}>{a.paciente}</div>
                                            <div style={{ fontSize: 12, color: '#71717a' }}>{a.edad} años · {a.motivo}</div>
                                        </td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', fontSize: 13, color: '#52525b' }}>{a.medico}</td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{a.hora}</td>
                                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef0ec' }}>
                                            <StatusBadge state={a.estado} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Citas próximas */}
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, flex: '1 1 320px', minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0ec', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>Citas de hoy</span>
                        {can('module.citas.access') && (
                            <Link href={citas()} style={{ color: '#2E8B3E', fontWeight: 500, fontSize: 13 }}>Ver agenda →</Link>
                        )}
                    </div>
                    {MOCK_CITAS.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f1f3ef' }}>
                            <span style={{ minWidth: 48, height: 28, padding: '0 8px', flexShrink: 0, borderRadius: 8, background: '#F3F7F2', color: '#1f2d22', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>{c.hora}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 500, color: '#1f2d22' }}>{c.paciente}</div>
                                <div style={{ fontSize: 12.5, color: '#71717a' }}>{c.medico} · {c.tipo}</div>
                            </div>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px',
                                borderRadius: 999, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                                background: c.estado === 'Confirmada' ? '#DBEAFE' : '#FEF3C7',
                                color: c.estado === 'Confirmada' ? '#1E40AF' : '#92400E',
                            }}>{c.estado}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                    { label: 'Nueva atención', href: registro.url(), permission: 'module.registro.access' },
                    { label: 'Tablero', href: tablero.url(), permission: 'module.tablero.access' },
                    { label: 'Caja', href: caja.url(), permission: 'module.caja.access' },
                    { label: 'Laboratorio', href: lab.url(), permission: 'module.lab.access' },
                ].filter((a) => can(a.permission)).map((a) => (
                    <Link key={a.href} href={a.href} style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, color: '#333', textDecoration: 'none', fontSize: 14 }}>
                        {a.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
