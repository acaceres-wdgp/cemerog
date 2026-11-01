import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { parseMoney } from '@/lib/money';
import * as types from '@/routes/habs/types';
import type { RoomTypeRow } from '../types';

const input =
    'h-9 rounded-lg border border-input-border bg-white px-3 outline-none focus:border-primary';
const iconBtn =
    'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-card-border bg-white text-text-secondary hover:bg-app-bg disabled:cursor-not-allowed disabled:opacity-40';
const opts = { preserveScroll: true, preserveState: true };

function TypeRow({ type }: { type: RoomTypeRow }) {
    const [name, setName] = useState(type.name);
    const [price, setPrice] = useState((type.daily_price / 100).toFixed(2));
    const changed =
        name.trim() !== type.name || parseMoney(price) !== type.daily_price;

    return (
        <div className="flex flex-wrap items-center gap-2 border-b border-divider py-2 last:border-b-0">
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label={`Nombre del tipo ${type.name}`}
                className={`${input} min-w-[140px] flex-1`}
            />
            <label className="flex items-center gap-1.5 text-[13px] text-muted">
                RD$
                <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                    aria-label={`Precio por día de ${type.name}`}
                    className={`${input} w-[110px] text-right tabular-nums`}
                />
                / día
            </label>
            <span className="w-[96px] text-right text-[12px] text-muted">
                {type.rooms} {type.rooms === 1 ? 'habitación' : 'habitaciones'}
            </span>
            {changed && (
                <button
                    type="button"
                    aria-label={`Guardar ${type.name}`}
                    onClick={() =>
                        router.put(
                            types.update.url(type.id),
                            {
                                name: name.trim(),
                                daily_price: parseMoney(price),
                            },
                            opts,
                        )
                    }
                    className={`${iconBtn} border-primary text-primary`}
                >
                    <Check className="h-4 w-4" />
                </button>
            )}
            <button
                type="button"
                aria-label={`Eliminar ${type.name}`}
                title={type.rooms > 0 ? 'Tiene habitaciones' : 'Eliminar'}
                disabled={type.rooms > 0}
                onClick={() => router.delete(types.destroy.url(type.id), opts)}
                className={`${iconBtn} hover:text-error`}
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}

/** Tipos de habitación y su precio por día */
export default function RoomTypesCard({ list }: { list: RoomTypeRow[] }) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    const add = (e: FormEvent) => {
        e.preventDefault();
        router.post(
            types.store.url(),
            { name: name.trim(), daily_price: parseMoney(price) },
            {
                ...opts,
                onSuccess: () => {
                    setName('');
                    setPrice('');
                },
            },
        );
    };

    return (
        <section className="rounded-[14px] border border-card-border bg-white px-5 py-4">
            <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="m-0 font-serif text-[16px] font-semibold text-text-heading">
                    Tipos de habitación
                </h2>
                <span className="text-[12.5px] text-muted">
                    El precio por día se carga al dar el alta
                </span>
            </div>
            {list.map((t) => (
                <TypeRow key={`${t.id}-${t.name}-${t.daily_price}`} type={t} />
            ))}
            {(errors.type || errors.name || errors.daily_price) && (
                <p className="m-0 mt-1 text-[12px] text-error">
                    {errors.type ?? errors.name ?? errors.daily_price}
                </p>
            )}
            <form onSubmit={add} className="mt-3 flex flex-wrap gap-2">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nuevo tipo, ej.: Suite"
                    aria-label="Nuevo tipo"
                    className={`${input} min-w-[160px] flex-1`}
                />
                <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                    placeholder="Precio / día"
                    aria-label="Precio por día del nuevo tipo"
                    className={`${input} w-[130px] text-right`}
                />
                <button
                    type="submit"
                    disabled={name.trim() === '' || price.trim() === ''}
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium hover:bg-accent-bg disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Agregar tipo
                </button>
            </form>
        </section>
    );
}
