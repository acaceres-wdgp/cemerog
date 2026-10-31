import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import Panel from '@/components/cemerog/Panel';
import StatusBadge from '@/components/cemerog/StatusBadge';
import { formatMoney, parseMoney } from '@/lib/money';
import { fee as feeRoute } from '@/routes/admin/emergencia';
import * as cubiclesRoutes from '@/routes/admin/emergencia/cubicles';

type Cubicle = { id: number; name: string; is_active: boolean };

type Props = { cubicles: Cubicle[]; emergency_fee: number };

const secondary =
    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium text-text-body hover:bg-accent-bg';
const primary =
    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover disabled:bg-primary-disabled';

/** Add or rename a cubicle; an existing one can also be deactivated */
function CubicleDialog({
    cubicle,
    onClose,
}: {
    cubicle: Cubicle | null;
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [name, setName] = useState(cubicle?.name ?? '');
    const [active, setActive] = useState(cubicle?.is_active ?? true);
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const options = {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setIsLoading(false),
        };
        if (cubicle) {
            router.put(
                cubiclesRoutes.update.url(cubicle.id),
                { name, is_active: active },
                options,
            );
        } else {
            router.post(cubiclesRoutes.store.url(), { name }, options);
        }
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title={cubicle ? `Editar ${cubicle.name}` : 'Agregar cubículo'}
            description="Los cubículos aparecen en el ingreso rápido y en el tablero de Emergencia."
            submitLabel={cubicle ? 'Guardar' : 'Agregar cubículo'}
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={name.trim() === ''}
        >
            <div className="flex flex-col gap-3">
                <FormField
                    name="name"
                    label="Nombre"
                    placeholder="Ej.: Cub. 7"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    required
                />
                {cubicle && (
                    <label className="flex cursor-pointer items-center gap-2 text-[14px]">
                        <input
                            type="checkbox"
                            checked={active}
                            onChange={(e) => setActive(e.target.checked)}
                        />
                        Activo (se puede asignar a pacientes)
                    </label>
                )}
            </div>
        </FormDialog>
    );
}

function FeeForm({ fee }: { fee: number }) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [value, setValue] = useState((fee / 100).toFixed(2));
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.put(
            feeRoute.url(),
            { emergency_fee: parseMoney(value) },
            { preserveScroll: true, onFinish: () => setIsLoading(false) },
        );
    };

    return (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <FormField
                name="emergency_fee"
                label="Cargo por emergencia (RD$)"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                error={errors.emergency_fee}
                className="w-[220px]"
            />
            <button type="submit" disabled={isLoading} className={primary}>
                Guardar
            </button>
            <p className="m-0 basis-full text-[13px] text-muted">
                Se carga a la cuenta del paciente al registrarlo en Emergencia.
                Actual: {formatMoney(fee)}.
            </p>
        </form>
    );
}

export default function AdminEmergencia({ cubicles, emergency_fee }: Props) {
    const [editing, setEditing] = useState<Cubicle | 'new' | null>(null);

    return (
        <div className="flex max-w-[860px] flex-col gap-4">
            <Panel title="Cargo de emergencia">
                <FeeForm fee={emergency_fee} />
            </Panel>
            <Panel
                title="Cubículos"
                description="Agrega, renombra o desactiva cubículos sin esperar una nueva versión."
                headerActions={
                    <button
                        type="button"
                        onClick={() => setEditing('new')}
                        className={secondary}
                    >
                        <Plus className="h-4 w-4" />
                        Agregar cubículo
                    </button>
                }
                noPadding
            >
                <ul className="m-0 list-none p-0">
                    {cubicles.map((c) => (
                        <li
                            key={c.id}
                            className="flex items-center justify-between gap-3 border-b border-divider px-5 py-3 last:border-b-0"
                        >
                            <span className="font-medium text-text-heading">
                                {c.name}
                            </span>
                            <span className="flex items-center gap-3">
                                <StatusBadge
                                    state={
                                        c.is_active ? 'saldada' : 'cancelada'
                                    }
                                    label={c.is_active ? 'Activo' : 'Inactivo'}
                                />
                                <button
                                    type="button"
                                    aria-label={`Editar ${c.name}`}
                                    onClick={() => setEditing(c)}
                                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-card-border bg-white text-text-secondary hover:bg-app-bg"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
            </Panel>
            {editing && (
                <CubicleDialog
                    cubicle={editing === 'new' ? null : editing}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}
