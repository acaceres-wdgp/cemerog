import React, { useState } from 'react';
import { BedSingle } from 'lucide-react';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import AdmitDialog from '@/components/internamiento/AdmitDialog';
import MoveDialog from '@/components/internamiento/MoveDialog';
import type {
    AdmissionOptions,
    FreeBed,
} from '@/components/internamiento/types';
import { formatMoney } from '@/lib/money';
import BedCard from './components/BedCard';
import type { BedStatus, MapBed, MapRoom } from './types';

type Filter = 'todas' | BedStatus;

/** Internamiento: mapa de habitaciones y camas */
export default function InternamientoIndex({
    rooms = [],
    admission_options = { beds: [], doctors: [], default_doctor_id: null },
    selected_bed_id = null,
}: {
    rooms?: MapRoom[];
    admission_options?: AdmissionOptions;
    selected_bed_id?: number | null;
}) {
    const [filter, setFilter] = useState<Filter>('todas');
    const [admitBed, setAdmitBed] = useState<number | null>(selected_bed_id);
    const [dragId, setDragId] = useState<number | null>(null);
    const [overId, setOverId] = useState<number | null>(null);
    const [move, setMove] = useState<{ from: MapBed; to: FreeBed } | null>(
        null,
    );

    const beds = rooms.flatMap((r) => r.beds);
    const count = (s: BedStatus) => beds.filter((b) => b.status === s).length;
    const dragged = beds.find((b) => b.id === dragId) ?? null;
    const freeBed = (id: number) =>
        admission_options.beds.find((b) => b.id === id);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <SegmentedControl<Filter>
                    segments={[
                        { value: 'todas', label: 'Todas', count: beds.length },
                        {
                            value: 'libre',
                            label: 'Libres',
                            count: count('libre'),
                        },
                        {
                            value: 'ocupada',
                            label: 'Ocupadas',
                            count: count('ocupada'),
                        },
                        {
                            value: 'limpieza',
                            label: 'En limpieza',
                            count: count('limpieza'),
                        },
                    ]}
                    value={filter}
                    onChange={setFilter}
                />
                <div className="inline-flex items-center gap-2 text-[13px] text-muted">
                    <BedSingle className="h-4 w-4" />
                    Vista de control · arrastra un paciente a una cama libre
                    para trasladarlo
                </div>
            </div>
            {rooms.length === 0 ? (
                <p className="m-0 rounded-[14px] border border-card-border bg-white p-8 text-center text-muted">
                    No hay habitaciones. Créalas en Administración ›
                    Habitaciones y camas.
                </p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rooms.map((r) => (
                        <section
                            key={r.id}
                            className="rounded-[14px] border border-card-border bg-white"
                        >
                            <div className="flex items-baseline justify-between gap-3 border-b border-divider px-4 py-3">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-serif text-[16px] font-semibold text-text-heading">
                                        {r.name}
                                    </span>
                                    <span className="text-[12.5px] text-muted">
                                        {r.type}
                                    </span>
                                </div>
                                <span className="text-[12.5px] text-text-secondary tabular-nums">
                                    {formatMoney(r.daily_price)} / día
                                </span>
                            </div>
                            <div className="grid gap-2 p-3 sm:grid-cols-2">
                                {r.beds.map((b) => (
                                    <BedCard
                                        key={b.id}
                                        bed={b}
                                        dragging={dragId !== null}
                                        over={overId === b.id}
                                        dimmed={
                                            dragId !== null
                                                ? b.status === 'limpieza' ||
                                                  b.id === dragId
                                                : filter !== 'todas' &&
                                                  b.status !== filter
                                        }
                                        onAdmit={() => setAdmitBed(b.id)}
                                        onDragStart={() => setDragId(b.id)}
                                        onDragEnd={() => {
                                            setDragId(null);
                                            setOverId(null);
                                        }}
                                        onDragOver={() => setOverId(b.id)}
                                        onDragLeave={() => setOverId(null)}
                                        onDrop={() => {
                                            const to = freeBed(b.id);
                                            if (dragged && to)
                                                setMove({ from: dragged, to });
                                            setDragId(null);
                                            setOverId(null);
                                        }}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
            {admitBed !== null && (
                <AdmitDialog
                    open
                    onOpenChange={(open) => !open && setAdmitBed(null)}
                    options={admission_options}
                    initialBedId={admitBed}
                    subtitle="Ingreso directo · busca al paciente"
                />
            )}
            {move && move.from.admission && (
                <MoveDialog
                    admissionId={move.from.admission.id}
                    patientName={move.from.admission.patient.full_name}
                    fromLabel={move.from.label}
                    beds={admission_options.beds}
                    target={move.to}
                    onClose={() => setMove(null)}
                />
            )}
        </div>
    );
}
