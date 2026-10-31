import React from 'react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import emergenciaRoutes from '@/routes/emergencia';
import type { CubicleCell } from '../types';

/** Every cubicle: an occupied one opens its patient, a free one the admission */
export default function CubicleMap({ cubicles }: { cubicles: CubicleCell[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {cubicles.map((c) => (
                <Link
                    key={c.id}
                    href={
                        c.emergency_id
                            ? emergenciaRoutes.show.url(c.emergency_id)
                            : emergenciaRoutes.ingreso.url({
                                  query: { cubiculo: c.id },
                              })
                    }
                    className={cn(
                        'inline-flex h-9 items-center gap-2 rounded-[10px] border px-3 text-[13.5px] whitespace-nowrap',
                        c.emergency_id
                            ? 'state-emergencia border-[var(--state-accent)] bg-white hover:bg-[var(--state-bg)]'
                            : 'border-accent-tip-border bg-list-row-bg hover:bg-accent-bg',
                    )}
                >
                    <span
                        className={cn(
                            'h-2 w-2 rounded-full',
                            c.emergency_id
                                ? 'bg-[var(--state-accent)]'
                                : 'bg-muted-light',
                        )}
                    />
                    <strong className="font-semibold text-text-heading">
                        {c.name}
                    </strong>
                    <span className="text-muted">{c.patient ?? 'Libre'}</span>
                </Link>
            ))}
        </div>
    );
}
