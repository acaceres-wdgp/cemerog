import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type CategoryItem = { id: number; name: string; count: number };

export type CategoryRoutes = {
    store: string;
    update: (id: number) => string;
    move: (id: number) => string;
    destroy: (id: number) => string;
};

const iconBtn =
    'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-card-border bg-white text-text-secondary hover:bg-app-bg disabled:cursor-not-allowed disabled:opacity-40';

function Row({
    item,
    first,
    last,
    routes,
}: {
    item: CategoryItem;
    first: boolean;
    last: boolean;
    routes: CategoryRoutes;
}) {
    const [name, setName] = useState(item.name);
    const changed = name.trim() !== '' && name.trim() !== item.name;
    const opts = { preserveScroll: true, preserveState: true };

    return (
        <li className="flex items-center gap-2 border-b border-divider py-2 last:border-b-0">
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label={`Nombre de ${item.name}`}
                className="h-9 min-w-0 flex-1 rounded-lg border border-input-border px-3 outline-none focus:border-primary"
            />
            <span className="w-[72px] text-right text-[12px] text-muted tabular-nums">
                {item.count} {item.count === 1 ? 'estudio' : 'estudios'}
            </span>
            {changed && (
                <button
                    type="button"
                    aria-label={`Guardar ${item.name}`}
                    onClick={() =>
                        router.put(
                            routes.update(item.id),
                            { name: name.trim() },
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
                aria-label={`Subir ${item.name}`}
                disabled={first}
                onClick={() =>
                    router.post(routes.move(item.id), { direction: 'up' }, opts)
                }
                className={iconBtn}
            >
                <ArrowUp className="h-4 w-4" />
            </button>
            <button
                type="button"
                aria-label={`Bajar ${item.name}`}
                disabled={last}
                onClick={() =>
                    router.post(
                        routes.move(item.id),
                        { direction: 'down' },
                        opts,
                    )
                }
                className={iconBtn}
            >
                <ArrowDown className="h-4 w-4" />
            </button>
            <button
                type="button"
                aria-label={`Eliminar ${item.name}`}
                title={
                    item.count > 0
                        ? 'Tiene estudios: muévelos a otra antes de eliminarla'
                        : 'Eliminar'
                }
                disabled={item.count > 0}
                onClick={() => router.delete(routes.destroy(item.id), opts)}
                className={`${iconBtn} hover:text-error`}
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </li>
    );
}

/**
 * Categories of a catalog (laboratory categories or imaging modalities):
 * rename, reorder, add, and delete the ones without studies.
 */
export default function CategoriesDialog({
    open,
    onOpenChange,
    title,
    description,
    placeholder,
    items,
    routes,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    placeholder: string;
    items: CategoryItem[];
    routes: CategoryRoutes;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [name, setName] = useState('');

    const add = (e: FormEvent) => {
        e.preventDefault();
        router.post(
            routes.store,
            { name: name.trim() },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setName(''),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <ul className="m-0 max-h-[50vh] list-none overflow-y-auto p-0">
                    {items.map((item, i) => (
                        <Row
                            key={`${item.id}-${item.name}`}
                            item={item}
                            first={i === 0}
                            last={i === items.length - 1}
                            routes={routes}
                        />
                    ))}
                </ul>
                {(errors.name || errors.category) && (
                    <p className="m-0 text-[12px] text-error">
                        {errors.name ?? errors.category}
                    </p>
                )}
                <form onSubmit={add} className="flex gap-2">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={placeholder}
                        aria-label="Nueva"
                        className="h-9 min-w-0 flex-1 rounded-lg border border-input-border px-3 outline-none focus:border-primary"
                    />
                    <button
                        type="submit"
                        disabled={name.trim() === ''}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover disabled:bg-primary-disabled"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
