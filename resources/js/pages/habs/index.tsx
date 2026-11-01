import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import NewRoomDialog from './components/NewRoomDialog';
import RoomCard from './components/RoomCard';
import RoomTypesCard from './components/RoomTypesCard';
import type { AdminRoom, RoomTypeRow } from './types';

/** Administración › Habitaciones y camas */
export default function HabsIndex({
    types = [],
    rooms = [],
}: {
    types?: RoomTypeRow[];
    rooms?: AdminRoom[];
}) {
    const [creating, setCreating] = useState(false);
    const beds = rooms.flatMap((r) => r.beds);
    const free = beds.filter((b) => b.status === 'libre').length;
    const next = rooms.length + 1;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-text-secondary">
                    {rooms.length}{' '}
                    {rooms.length === 1 ? 'habitación' : 'habitaciones'} ·{' '}
                    {beds.length} {beds.length === 1 ? 'cama' : 'camas'} ·{' '}
                    {free} {free === 1 ? 'libre' : 'libres'}
                </p>
                <button
                    type="button"
                    disabled={types.length === 0}
                    title={
                        types.length === 0
                            ? 'Agrega primero un tipo de habitación'
                            : undefined
                    }
                    onClick={() => setCreating(true)}
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover disabled:bg-primary-disabled"
                >
                    <Plus className="h-4 w-4" />
                    Nueva habitación
                </button>
            </div>
            <RoomTypesCard list={types} />
            {rooms.length === 0 ? (
                <p className="m-0 rounded-[14px] border border-card-border bg-white p-8 text-center text-muted">
                    Aún no hay habitaciones. Crea la primera.
                </p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {rooms.map((r) => (
                        <RoomCard key={r.id} room={r} types={types} />
                    ))}
                </div>
            )}
            {creating && (
                <NewRoomDialog
                    types={types}
                    suggestedName={`Hab. ${next}`}
                    onClose={() => setCreating(false)}
                />
            )}
        </div>
    );
}
