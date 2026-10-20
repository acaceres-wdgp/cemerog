import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { PatientSearchResult } from '@/types/patient';

type PaginatedPatients = {
    data: PatientSearchResult[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    patients: PaginatedPatients;
    filters: { q?: string };
};

export default function RegistroIndex({ patients, filters }: Props) {
    const [search, setSearch] = useState(filters.q ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/registro', { q: search || undefined }, { preserveState: true, replace: true });
    };

    const handleDelete = (patient: PatientSearchResult) => {
        if (!confirm(`¿Eliminar a ${patient.full_name}? Esta acción no se puede deshacer.`)) return;
        router.delete(`/registro/pacientes/${patient.id}`);
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 26, color: '#1f2d22', margin: 0 }}>
                        Pacientes
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                        {patients.total} {patients.total === 1 ? 'paciente registrado' : 'pacientes registrados'}
                    </p>
                </div>
                <a
                    href="/registro/nuevo"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 36, padding: '0 14px', borderRadius: 10, border: 'none',
                        background: '#2E8B3E', color: '#fff', fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
                        textDecoration: 'none',
                    }}
                >
                    + Nuevo paciente
                </a>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: '0 1 380px' }}>
                    <span style={{ position: 'absolute', left: 10, top: 10, fontSize: 15, color: '#71717a', pointerEvents: 'none' }}>🔍</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por cédula, nombre o teléfono…"
                        style={{ height: 36, padding: '0 12px 0 34px', border: '1px solid #e4e4e7', borderRadius: 10, outline: 'none', width: '100%', fontSize: 14, fontFamily: 'inherit' }}
                    />
                </div>
                <button
                    type="submit"
                    style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #e4e4e7', background: '#fff', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}
                >
                    Buscar
                </button>
                {filters.q && (
                    <button
                        type="button"
                        onClick={() => { setSearch(''); router.get('/registro', {}, { replace: true }); }}
                        style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #e4e4e7', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, color: '#71717a' }}
                    >
                        Limpiar
                    </button>
                )}
            </form>

            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                {patients.data.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: '#71717a' }}>
                        {filters.q
                            ? `No se encontraron pacientes para «${filters.q}».`
                            : 'No hay pacientes registrados aún.'}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #eef0ec', background: '#F8FBF6' }}>
                                <th style={thStyle}>Paciente</th>
                                <th style={thStyle}>Documento</th>
                                <th style={thStyle}>Edad</th>
                                <th style={thStyle}>Teléfono</th>
                                <th style={thStyle}>Sangre</th>
                                <th style={thStyle}>Alergias</th>
                                <th style={{ ...thStyle, width: 100 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.data.map((p, i) => (
                                <tr
                                    key={p.id}
                                    style={{ borderBottom: i < patients.data.length - 1 ? '1px solid #f0f2f0' : 'none' }}
                                >
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: '#EEF6E2', color: '#2f4a17', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>
                                                {p.initials}
                                            </span>
                                            <div>
                                                <div style={{ fontWeight: 500, color: '#1f2d22' }}>{p.full_name}</div>
                                                <div style={{ fontSize: 12, color: '#71717a' }}>{p.sex === 'F' ? 'Femenina' : 'Masculino'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ fontSize: 13 }}>{p.document_number}</div>
                                        <div style={{ fontSize: 11, color: '#71717a', textTransform: 'capitalize' }}>{p.document_type}</div>
                                    </td>
                                    <td style={tdStyle}>{p.age} años</td>
                                    <td style={tdStyle}>{p.phone ?? '—'}</td>
                                    <td style={tdStyle}>
                                        {p.blood_type
                                            ? <span style={{ padding: '2px 8px', borderRadius: 999, background: '#EEF6E2', color: '#2f4a17', fontSize: 12, fontWeight: 600 }}>{p.blood_type}</span>
                                            : <span style={{ color: '#c4c9c4' }}>—</span>}
                                    </td>
                                    <td style={tdStyle}>
                                        {p.allergies
                                            ? <span style={{ padding: '2px 8px', borderRadius: 999, background: '#fef2f2', color: '#b91c1c', fontSize: 12, fontWeight: 500 }}>⚠ Alergias</span>
                                            : <span style={{ color: '#c4c9c4' }}>—</span>}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            <a
                                                href={`/registro/pacientes/${p.id}/editar`}
                                                style={{ height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid #dfe7df', background: '#F6F9F5', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#1f2d22' }}
                                            >
                                                Editar
                                            </a>
                                            <button
                                                onClick={() => handleDelete(p)}
                                                style={{ height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {patients.last_page > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                    {patients.links.map((link, i) => (
                        <button
                            key={i}
                            disabled={!link.url}
                            onClick={() => link.url && router.get(link.url)}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            style={{
                                height: 32, minWidth: 32, padding: '0 10px', borderRadius: 8, border: '1px solid #e4e4e7',
                                background: link.active ? '#2E8B3E' : '#fff',
                                color: link.active ? '#fff' : link.url ? '#1f2d22' : '#c4c9c4',
                                fontWeight: link.active ? 600 : 400,
                                cursor: link.url ? 'pointer' : 'default',
                                fontFamily: 'inherit', fontSize: 13,
                            }}
                        />
                    ))}
                </div>
            )}

            {patients.data.length > 0 && (
                <p style={{ textAlign: 'center', fontSize: 13, color: '#71717a', margin: 0 }}>
                    Mostrando {patients.from}–{patients.to} de {patients.total} pacientes
                </p>
            )}
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontSize: 12,
    fontWeight: 600, color: '#5f6b64', textTransform: 'uppercase', letterSpacing: '0.04em',
};

const tdStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: 14, color: '#1f2d22', verticalAlign: 'middle',
};
