import React from 'react';
import { router } from '@inertiajs/react';
import { BedSingle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import internamiento from '@/routes/internamiento';
import type { MapBed } from '../types';

const PILL: Record<MapBed['status'], { label: string; cls: string }> = {
    libre: { label: 'Libre', cls: 'bg-accent-bg text-accent-fg' },
    ocupada: {
        label: 'Internado',
        cls: 'state-internado bg-[var(--state-bg)] text-[var(--state-text)]',
    },
    limpieza: {
        label: 'En limpieza',
        cls: 'state-espera bg-[var(--state-bg)] text-[var(--state-text)]',
    },
};

/**
 * A bed on the map. An occupied bed opens the ficha and can be dragged to a
 * free bed; a free bed starts an admission; a bed in cleaning is marked
 * ready.
 */
export default function BedCard({
    bed,
    dimmed,
    dragging,
    over,
    onAdmit,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
}: {
    bed: MapBed;
    dimmed: boolean;
    dragging: boolean;
    over: boolean;
    onAdmit: () => void;
    onDragStart: () => void;
    onDragEnd: () => void;
    onDragOver: () => void;
    onDragLeave: () => void;
    onDrop: () => void;
}) {
    const target = dragging && bed.status === 'libre';
    const a = bed.admission;
    const open = () => {
        if (bed.status === 'ocupada' && a)
            router.visit(internamiento.show.url(a.id));
        else if (bed.status === 'libre') onAdmit();
    };

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={`${bed.label} · ${PILL[bed.status].label}`}
            onClick={open}
            onKeyDown={(e) => e.key === 'Enter' && open()}
            draggable={bed.status === 'ocupada'}
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                onDragStart();
            }}
            onDragEnd={onDragEnd}
            onDragOver={(e) => {
                if (!target) return;
                e.preventDefault();
                onDragOver();
            }}
            onDragLeave={onDragLeave}
            onDrop={(e) => {
                e.preventDefault();
                if (target) onDrop();
            }}
            className={cn(
                'flex min-h-[112px] flex-col gap-1 rounded-[12px] border p-3 transition-opacity',
                bed.status === 'ocupada' &&
                    'cursor-grab border-card-border bg-white hover:shadow-sm',
                bed.status === 'libre' &&
                    'cursor-pointer border-dashed border-accent-border bg-list-row-bg hover:bg-accent-bg',
                bed.status === 'limpieza' &&
                    'state-espera border-transparent bg-[var(--state-bg)]',
                target && 'border-2 border-dashed border-primary bg-accent-bg',
                over && 'border-2 border-solid border-primary',
                dimmed && 'opacity-35',
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary">
                    <BedSingle className="h-4 w-4" />
                    {bed.name}
                </span>
                <span
                    className={cn(
                        'rounded-full px-2 py-0.5 text-[11.5px] font-medium',
                        over ? 'bg-primary text-white' : PILL[bed.status].cls,
                    )}
                >
                    {over ? 'Soltar aquí' : PILL[bed.status].label}
                </span>
            </div>
            {bed.status === 'ocupada' && a && (
                <>
                    <div className="font-medium text-text-heading">
                        {a.patient.full_name}
                    </div>
                    <div className="truncate text-[12.5px] text-text-secondary">
                        {a.diagnosis}
                    </div>
                    <div className="text-[12px] text-muted">
                        Día {a.day} · {a.doctor}
                    </div>
                </>
            )}
            {bed.status === 'libre' && (
                <div className="text-[13px] text-muted">
                    {target
                        ? 'Trasladar aquí'
                        : 'Disponible · clic para ingresar'}
                </div>
            )}
            {bed.status === 'limpieza' && (
                <>
                    <div className="text-[12.5px] text-[var(--state-text)]">
                        Desde las {bed.cleaning_since}
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.post(
                                internamiento.beds.ready.url(bed.id),
                                {},
                                { preserveScroll: true },
                            );
                        }}
                        className="mt-auto inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-card-border bg-white text-[13px] font-medium hover:bg-app-bg"
                    >
                        <Check className="h-4 w-4" />
                        Marcar lista
                    </button>
                </>
            )}
        </div>
    );
}
