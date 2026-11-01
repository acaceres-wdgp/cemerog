import React from 'react';
import { router } from '@inertiajs/react';
import { BedSingle, Plus, Trash2 } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import * as beds from '@/routes/habs/beds';
import * as rooms from '@/routes/habs/rooms';
import { BED_STATUS } from '../types';
import type { AdminRoom, RoomTypeRow } from '../types';

const opts = { preserveScroll: true, preserveState: true };

/** A room: its type (and price per day) and its beds */
export default function RoomCard({
    room,
    types,
}: {
    room: AdminRoom;
    types: RoomTypeRow[];
}) {
    return (
        <section className="flex flex-col rounded-[14px] border border-card-border bg-white">
            <div className="flex items-start justify-between gap-3 border-b border-divider px-4 py-3">
                <div>
                    <div className="font-serif text-[16px] font-semibold text-text-heading">
                        {room.name}
                    </div>
                    <div className="text-[12.5px] text-muted">
                        {formatMoney(room.daily_price)} por día
                    </div>
                </div>
                <select
                    value={room.type_id}
                    aria-label={`Tipo de ${room.name}`}
                    onChange={(e) =>
                        router.put(
                            rooms.update.url(room.id),
                            {
                                name: room.name,
                                room_type_id: Number(e.target.value),
                            },
                            opts,
                        )
                    }
                    className="h-8 rounded-lg border border-input-border bg-white px-2 text-[13px] outline-none focus:border-primary"
                >
                    {types.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex flex-1 flex-col px-4 py-1">
                {room.beds.map((b) => {
                    const canRemove =
                        b.status !== 'ocupada' && room.beds.length > 1;
                    return (
                        <div
                            key={b.id}
                            className="flex items-center gap-2 border-b border-divider py-2 last:border-b-0"
                        >
                            <BedSingle className="h-4 w-4 text-text-tertiary" />
                            <div className="min-w-0 flex-1">
                                <div className="text-[13.5px] font-medium">
                                    {b.name}
                                </div>
                                {b.patient && (
                                    <div className="truncate text-[12px] text-muted">
                                        {b.patient}
                                    </div>
                                )}
                            </div>
                            <span
                                className={cn(
                                    'rounded-full px-2 py-0.5 text-[11.5px] font-medium',
                                    BED_STATUS[b.status].pill,
                                )}
                            >
                                {BED_STATUS[b.status].label}
                            </span>
                            {canRemove && (
                                <button
                                    type="button"
                                    title="Quitar cama"
                                    aria-label={`Quitar ${b.name} de ${room.name}`}
                                    onClick={() =>
                                        router.delete(
                                            beds.destroy.url(b.id),
                                            opts,
                                        )
                                    }
                                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-muted hover:bg-error-bg hover:text-error"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="border-t border-divider px-4 py-2">
                <button
                    type="button"
                    onClick={() =>
                        router.post(beds.store.url(room.id), {}, opts)
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-primary"
                >
                    <Plus className="h-4 w-4" />
                    Agregar cama
                </button>
            </div>
        </section>
    );
}
