import { Head, Link, router } from '@inertiajs/react';
import { registro } from '@/routes';
import { show as showPaciente } from '@/routes/pacientes';
import { edit as editPaciente } from '@/routes/registro/pacientes';
import { ChevronRight, Plus, Search, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import DataTable, {
    type DataTableColumn,
    type LaravelPaginator,
} from '@/components/cemerog/DataTable';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { Sheet, SheetContent } from '@/components/ui/sheet';

// ── Types ────────────────────────────────────────────────────────────────────

type FilterValue =
    | 'todos'
    | 'atendidos_hoy'
    | 'con_alergias'
    | 'sin_atenciones';
type SortValue = 'ultima_atencion' | 'nombre' | 'registro';

const VALID_FILTERS: FilterValue[] = [
    'todos',
    'atendidos_hoy',
    'con_alergias',
    'sin_atenciones',
];
const VALID_SORTS: SortValue[] = ['ultima_atencion', 'nombre', 'registro'];

interface PatientRow {
    id: number;
    expediente_number: string;
    full_name: string;
    initials: string;
    first_names: string;
    last_names: string;
    document_type: string;
    document_number: string;
    sex: string;
    age: number;
    birth_date: string;
    phone: string | null;
    blood_type: string | null;
    allergies: string | null;
    photo_url: string | null;
    attended_today: boolean;
    last_attended_at: string | null;
    last_turn_type: string | null;
    last_turn_doctor: string | null;
}

interface TurnDetail {
    id: number;
    turn_number: number;
    arrived_at: string;
    status: string;
    doctor_name: string;
    doctor_specialty: string;
    notes: string | null;
    type: string;
}

interface SelectedPatient extends PatientRow {
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    created_at: string | null;
    recent_turns: TurnDetail[];
    total_turns: number;
    birth_date: string; // dd/MM/yyyy formatted
}

interface Counts {
    total: number;
    attended_today: number;
    con_alergias: number;
    sin_atenciones: number;
}

interface Filters {
    q: string;
    filter: FilterValue;
    sort: SortValue;
}

interface Props {
    patients: LaravelPaginator<PatientRow>;
    counts: Counts;
    filters: Filters;
    selected: SelectedPatient | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function PatientAvatar({
    initials,
    photoUrl,
    size = 34,
}: {
    initials: string;
    photoUrl: string | null;
    size?: number;
}) {
    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt=""
                className="rounded-full object-cover"
                // dynamic-style: avatar size is a runtime prop (number in px)
                style={{ width: size, height: size }}
            />
        );
    }
    return (
        <div
            className="flex items-center justify-center rounded-full bg-accent-bg font-semibold text-accent-fg"
            // dynamic-style: avatar size and font-size are computed from runtime prop
            style={{ width: size, height: size, fontSize: size * 0.37 }}
        >
            {initials}
        </div>
    );
}

const DOC_LABELS: Record<string, string> = {
    cedula: 'Cédula',
    pasaporte: 'Pasaporte',
    cedula_extranjera: 'Cédula extranjera',
    no_tiene: 'Sin documento',
};

// ── Columns ──────────────────────────────────────────────────────────────────

const columns: DataTableColumn<PatientRow>[] = [
    {
        id: 'patient',
        header: 'Paciente',
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <PatientAvatar
                    initials={row.original.initials}
                    photoUrl={row.original.photo_url}
                />
                <div>
                    <p className="font-semibold text-text-heading">
                        {row.original.full_name}
                    </p>
                    <p className="text-[12.5px] text-muted">
                        {row.original.sex === 'F' ? 'Femenino' : 'Masculino'} ·{' '}
                        {row.original.age} años
                    </p>
                </div>
            </div>
        ),
    },
    {
        id: 'document',
        header: 'Documento',
        cell: ({ row }) => (
            <div>
                <p className="text-text-body tabular-nums">
                    {row.original.document_number}
                </p>
                <p className="text-[12px] text-muted">
                    {DOC_LABELS[row.original.document_type] ??
                        row.original.document_type}
                </p>
            </div>
        ),
    },
    {
        id: 'phone',
        header: 'Teléfono',
        cell: ({ row }) => (
            <span className="text-text-body tabular-nums">
                {row.original.phone ?? '—'}
            </span>
        ),
    },
    {
        id: 'blood',
        header: 'Sangre',
        cell: ({ row }) =>
            row.original.blood_type ? (
                <span className="inline-flex items-center rounded-[7px] bg-surface px-2 py-0.5 text-[12.5px] font-semibold text-zinc-700">
                    {row.original.blood_type}
                </span>
            ) : (
                <span className="text-muted-light">—</span>
            ),
    },
    {
        id: 'allergies',
        header: 'Alergias',
        cell: ({ row }) =>
            row.original.allergies ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-error-bg px-2 py-0.5 text-[12px] text-error">
                    <TriangleAlert className="h-[13px] w-[13px]" />
                    {row.original.allergies}
                </span>
            ) : (
                <span className="text-[13px] text-text-tertiary">
                    Ninguna conocida
                </span>
            ),
    },
    {
        id: 'last_visit',
        header: 'Última atención',
        cell: ({ row }) =>
            row.original.last_attended_at ? (
                <div>
                    <p className="text-text-body">
                        {row.original.last_attended_at}
                    </p>
                    {row.original.last_turn_doctor && (
                        <p className="text-[12px] text-muted">
                            {row.original.last_turn_type} ·{' '}
                            {row.original.last_turn_doctor}
                        </p>
                    )}
                </div>
            ) : (
                <div>
                    <p className="text-muted-light">—</p>
                    <p className="text-[12px] text-text-tertiary">
                        Sin atenciones
                    </p>
                </div>
            ),
    },
    {
        id: 'chevron',
        header: '',
        cell: () => <ChevronRight className="h-4 w-4 text-muted-light" />,
    },
];

// ── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ patient }: { patient: SelectedPatient }) {
    const sexLabel = patient.sex === 'F' ? 'Femenino' : 'Masculino';

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            {/* pr-12 leaves room for the Sheet's built-in close button */}
            <div className="flex items-start gap-4 border-b border-divider py-5 pr-12 pl-6">
                <PatientAvatar
                    initials={patient.initials}
                    photoUrl={patient.photo_url}
                    size={48}
                />
                <div className="min-w-0 flex-1">
                    <p className="font-['Bitter'] text-[19px] leading-tight font-semibold text-text-heading">
                        {patient.full_name}
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted">
                        {sexLabel} · {patient.age} años · Expediente{' '}
                        {patient.expediente_number}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {/* Allergy banner */}
                {patient.allergies && (
                    <div className="flex items-start gap-2 rounded-xl border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error-strong">
                        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                            <strong>Alergia:</strong> {patient.allergies}
                        </p>
                    </div>
                )}

                {/* Personal data */}
                <section>
                    <p className="mb-3 text-[11.5px] font-semibold tracking-[.05em] text-table-header-text uppercase">
                        Datos personales
                    </p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[13px]">
                        <dt className="text-muted">Documento</dt>
                        <dd className="text-text-body tabular-nums">
                            {patient.document_number}{' '}
                            <span className="text-muted">
                                (
                                {DOC_LABELS[patient.document_type] ??
                                    patient.document_type}
                                )
                            </span>
                        </dd>
                        <dt className="text-muted">Nacimiento</dt>
                        <dd className="text-text-body">
                            {patient.birth_date} ({patient.age} años)
                        </dd>
                        <dt className="text-muted">Sangre</dt>
                        <dd className="text-text-body">
                            {patient.blood_type ?? 'No registrado'}
                        </dd>
                        <dt className="text-muted">Teléfono</dt>
                        <dd className="text-text-body tabular-nums">
                            {patient.phone ?? '—'}
                        </dd>
                        {patient.address && (
                            <>
                                <dt className="text-muted">Dirección</dt>
                                <dd className="text-text-body">
                                    {patient.address}
                                </dd>
                            </>
                        )}
                        {(patient.emergency_contact_name ||
                            patient.emergency_contact_phone) && (
                            <>
                                <dt className="text-muted">Contacto emerg.</dt>
                                <dd className="text-text-body">
                                    {[
                                        patient.emergency_contact_name,
                                        patient.emergency_contact_phone,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </dd>
                            </>
                        )}
                        <dt className="text-muted">Registrado</dt>
                        <dd className="text-text-body">
                            {patient.created_at ?? '—'}
                        </dd>
                    </dl>
                </section>

                {/* Recent visits */}
                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-[11.5px] font-semibold tracking-[.05em] text-table-header-text uppercase">
                            Últimas atenciones
                        </p>
                        <span className="text-[12px] text-muted">
                            {patient.total_turns} en total
                        </span>
                    </div>
                    {patient.recent_turns.length === 0 ? (
                        <p className="text-[13px] text-text-tertiary">
                            Todavía no tiene atenciones.
                        </p>
                    ) : (
                        <ul className="divide-y divide-divider rounded-xl border border-divider">
                            {patient.recent_turns.map((t) => (
                                <li
                                    key={t.id}
                                    className="flex items-start justify-between gap-3 px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-medium text-text-heading">
                                            {t.type} · T-{t.turn_number}
                                        </p>
                                        <p className="text-[12px] text-muted">
                                            {t.doctor_name}
                                            {t.notes ? ` · ${t.notes}` : ''}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[12px] text-text-tertiary tabular-nums">
                                        {t.arrived_at}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-divider px-6 py-4">
                <Link
                    href={editPaciente.url({ patient: patient.id })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-card-border bg-white px-3.5 text-sm font-medium whitespace-nowrap text-text-body hover:bg-app-bg"
                >
                    Editar
                </Link>
                <Link
                    href={showPaciente.url({ patient: patient.id })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-card-border bg-white px-3.5 text-sm font-medium whitespace-nowrap text-text-body hover:bg-app-bg"
                >
                    Ver perfil
                    <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                    href={registro.url({ query: { paciente: patient.id } })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium whitespace-nowrap text-white hover:bg-primary-hover"
                >
                    <Plus className="h-4 w-4" />
                    Nueva atención
                </Link>
            </div>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PacientesIndex({
    patients,
    counts,
    filters,
    selected,
}: Props) {
    const [search, setSearch] = useState(
        typeof filters.q === 'string' ? filters.q : '',
    );
    const [activeFilter, setActiveFilter] = useState<FilterValue>(
        VALID_FILTERS.includes(filters.filter) ? filters.filter : 'todos',
    );
    const [sort, setSort] = useState<SortValue>(
        VALID_SORTS.includes(filters.sort) ? filters.sort : 'ultima_atencion',
    );
    const [panelOpen, setPanelOpen] = useState(selected !== null);
    const [selectedPatient, setSelectedPatient] =
        useState<SelectedPatient | null>(selected);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const navigate = useCallback(
        (
            overrides: Partial<{
                q: string;
                filter: FilterValue;
                sort: SortValue;
                page: number;
                paciente?: number | null;
            }>,
        ) => {
            const params: Record<string, string | number | undefined> = {
                q: 'q' in overrides ? overrides.q : search,
                filter: 'filter' in overrides ? overrides.filter : activeFilter,
                sort: 'sort' in overrides ? overrides.sort : sort,
                page: 'page' in overrides ? overrides.page : 1,
            };
            if ('paciente' in overrides && overrides.paciente) {
                params.paciente = overrides.paciente;
            }
            router.get('/pacientes', params, {
                preserveState: true,
                replace: true,
                only: ['patients', 'counts', 'selected'],
            });
        },
        [search, activeFilter, sort],
    );

    const handleSearch = (value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => navigate({ q: value }), 300);
    };

    const handleRowClick = (row: PatientRow) => {
        router.get(
            '/pacientes',
            { q: search, filter: activeFilter, sort, paciente: row.id },
            {
                preserveState: true,
                replace: true,
                only: ['selected'],
                onSuccess: (page) => {
                    const sel = (
                        page.props as { selected?: SelectedPatient | null }
                    ).selected;
                    if (sel) {
                        setSelectedPatient(sel);
                        setPanelOpen(true);
                    }
                },
            },
        );
    };

    const handleClosePanel = () => {
        setPanelOpen(false);
        router.get(
            '/pacientes',
            { q: search, filter: activeFilter, sort },
            { preserveState: true, replace: true, only: [] },
        );
    };

    // Sync external prop changes (e.g., back/forward navigation)
    useEffect(() => {
        if (selected) {
            setSelectedPatient(selected);
            setPanelOpen(true);
        }
    }, [selected]);

    const filterSegments = [
        { value: 'todos' as FilterValue, label: 'Todos', count: counts.total },
        {
            value: 'atendidos_hoy' as FilterValue,
            label: 'Atendidos hoy',
            count: counts.attended_today,
        },
        {
            value: 'con_alergias' as FilterValue,
            label: 'Con alergias',
            count: counts.con_alergias,
        },
        {
            value: 'sin_atenciones' as FilterValue,
            label: 'Sin atenciones',
            count: counts.sin_atenciones,
        },
    ];

    return (
        <>
            <Head title="Pacientes" />

            <div className="flex h-full flex-col gap-5">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">
                        {counts.total} pacientes registrados ·{' '}
                        {counts.attended_today} atendidos hoy
                    </p>
                    <Link
                        href={registro.url()}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-[14px] text-sm font-medium text-white hover:bg-primary-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo paciente
                    </Link>
                </div>

                {/* Panel */}
                <div className="rounded-[14px] border border-card-border bg-white shadow-[0_1px_2px_rgba(16,40,24,.03)]">
                    {/* Filter bar */}
                    <div className="flex flex-wrap items-center gap-3 border-b border-divider px-5 py-3.5">
                        {/* Search */}
                        <div className="relative min-w-[280px] flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Buscar por cédula, nombre o teléfono…"
                                className="h-9 w-full rounded-lg border border-card-border bg-white pr-3 pl-9 text-sm text-text-body placeholder-muted-light outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        {/* Segment filter */}
                        <SegmentedControl
                            segments={filterSegments}
                            value={activeFilter}
                            onChange={(v) => {
                                setActiveFilter(v);
                                navigate({ filter: v });
                            }}
                        />

                        {/* Sort */}
                        <select
                            value={sort}
                            onChange={(e) => {
                                const v = e.target.value as SortValue;
                                setSort(v);
                                navigate({ sort: v });
                            }}
                            className="h-9 rounded-lg border border-card-border bg-white px-3 text-sm text-text-body outline-none focus:border-primary"
                        >
                            <option value="ultima_atencion">
                                Última atención (reciente)
                            </option>
                            <option value="nombre">Nombre (A–Z)</option>
                            <option value="registro">Fecha de registro</option>
                        </select>
                    </div>

                    {/* Table */}
                    <DataTable
                        data={patients.data}
                        columns={columns}
                        paginator={patients}
                        onPageChange={(page) => navigate({ page })}
                        onRowClick={handleRowClick}
                        selectedRowId={selectedPatient?.id}
                        noun="pacientes"
                        emptyMessage={
                            search
                                ? `Ningún paciente coincide con «${search}».`
                                : 'No hay pacientes en este filtro.'
                        }
                    />

                    {patients.data.length === 0 && activeFilter === 'todos' && (
                        <div className="flex justify-center py-6">
                            <Link
                                href={
                                    search
                                        ? /^[\d-]+$/.test(search)
                                            ? registro.url({
                                                  query: {
                                                      documento: search,
                                                  },
                                              })
                                            : registro.url({
                                                  query: { nombre: search },
                                              })
                                        : registro.url()
                                }
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-card-border bg-white px-3.5 text-sm font-medium text-text-body hover:bg-app-bg"
                            >
                                <Plus className="h-4 w-4" />
                                Registrar paciente nuevo
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail sheet */}
            <Sheet
                open={panelOpen}
                onOpenChange={(open) => !open && handleClosePanel()}
            >
                <SheetContent side="right" className="w-[460px] max-w-full p-0">
                    {selectedPatient && (
                        <DetailPanel patient={selectedPatient} />
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
