import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Search } from 'lucide-react';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import ImagingStudyDialog from './components/ImagingStudyDialog';
import type { ImagingStudyRow } from './types';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';

/** Administración › Catálogo de imágenes */
export default function ImgcatIndex({
    studies = [],
    modalities = [],
    next_code = 'I-01',
}: {
    studies?: ImagingStudyRow[];
    modalities?: string[];
    next_code?: string;
}) {
    const [modality, setModality] = useState('todas');
    const [query, setQuery] = useState('');
    const [editing, setEditing] = useState<ImagingStudyRow | 'new' | null>(
        null,
    );

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return studies
            .filter((t) => modality === 'todas' || t.modality === modality)
            .filter(
                (t) =>
                    q === '' || `${t.code} ${t.name}`.toLowerCase().includes(q),
            );
    }, [studies, modality, query]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex h-10 w-[280px] items-center gap-2 rounded-[10px] border border-input-border bg-white px-3 focus-within:border-primary">
                        <Search className="h-4 w-4 text-muted" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar estudio o código…"
                            aria-label="Buscar estudio o código"
                            className="w-full border-0 bg-transparent outline-none"
                        />
                    </label>
                    <SegmentedControl
                        segments={[
                            {
                                value: 'todas',
                                label: 'Todas',
                                count: studies.length,
                            },
                            ...modalities
                                .filter((m) =>
                                    studies.some((t) => t.modality === m),
                                )
                                .map((m) => ({
                                    value: m,
                                    label: m,
                                    count: studies.filter(
                                        (t) => t.modality === m,
                                    ).length,
                                })),
                        ]}
                        value={modality}
                        onChange={setModality}
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setEditing('new')}
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo estudio
                </button>
            </div>
            <section className="overflow-x-auto rounded-[14px] border border-card-border bg-white">
                <table className="w-full min-w-[820px] border-collapse text-[14px]">
                    <thead>
                        <tr>
                            <th className={`${th} pl-5 text-left`}>Código</th>
                            <th className={`${th} text-left`}>Estudio</th>
                            <th className={`${th} text-left`}>Modalidad</th>
                            <th className={`${th} text-left`}>Preparación</th>
                            <th className={`${th} text-right`}>Precio</th>
                            <th className={`${th} text-left`}>Estado</th>
                            <th className={`${th} pr-5`}>
                                <span className="sr-only">Editar</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((t) => (
                            <tr
                                key={t.id}
                                className={cn(!t.is_active && 'text-muted')}
                            >
                                <td
                                    className={`${td} pl-5 font-mono text-[12.5px]`}
                                >
                                    {t.code}
                                </td>
                                <td
                                    className={`${td} font-medium text-text-heading`}
                                >
                                    {t.name}
                                </td>
                                <td className={td}>
                                    <span className="rounded-full bg-accent-bg px-[10px] py-[3px] text-[12px] font-medium text-accent-fg">
                                        {t.modality}
                                    </span>
                                </td>
                                <td
                                    className={`${td} max-w-[260px] text-[13px] text-text-secondary`}
                                >
                                    {t.preparation ?? '—'}
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                    {formatMoney(t.price)}
                                </td>
                                <td className={td}>
                                    {t.is_active ? 'Activo' : 'Inactivo'}
                                </td>
                                <td className={`${td} pr-5 text-right`}>
                                    <button
                                        type="button"
                                        aria-label={`Editar ${t.name}`}
                                        onClick={() => setEditing(t)}
                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-card-border bg-white text-text-secondary hover:bg-app-bg"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && (
                    <div className="p-8 text-center text-muted">
                        {studies.length === 0
                            ? 'El catálogo está vacío. Agrega el primer estudio.'
                            : 'Ningún estudio coincide con la búsqueda.'}
                    </div>
                )}
            </section>
            <p className="m-0 text-[13px] text-muted">
                Los estudios activos aparecen al indicar imágenes en Consulta,
                Emergencia y en el registro de pacientes que vienen solo a
                estudios. Al desactivar uno, deja de ofrecerse pero se conserva
                en los informes históricos.
            </p>
            {editing && (
                <ImagingStudyDialog
                    study={editing === 'new' ? null : editing}
                    modalities={modalities}
                    nextCode={next_code}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}
