import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import { parseMoney } from '@/lib/money';
import * as imgcat from '@/routes/imgcat';
import type { ImagingStudyRow } from '../types';

/** Nuevo estudio / Editar estudio */
export default function ImagingStudyDialog({
    study,
    modalities,
    nextCode,
    onClose,
}: {
    study: ImagingStudyRow | null;
    modalities: string[];
    nextCode: string;
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [form, setForm] = useState({
        code: study?.code ?? nextCode,
        name: study?.name ?? '',
        modality: study?.modality ?? 'Sonografía',
        preparation: study?.preparation ?? '',
        price: study ? (study.price / 100).toFixed(2) : '',
        is_active: study?.is_active ?? true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const set = (patch: Partial<typeof form>) =>
        setForm((f) => ({ ...f, ...patch }));
    const valid =
        form.code.trim() !== '' &&
        form.name.trim() !== '' &&
        form.price.trim() !== '';

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const payload = {
            code: form.code.trim(),
            name: form.name.trim(),
            modality: form.modality,
            preparation: form.preparation.trim() || null,
            price: parseMoney(form.price),
            ...(study ? { is_active: form.is_active } : {}),
        };
        const options = {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setIsLoading(false),
        };
        if (study) router.put(imgcat.update.url(study.id), payload, options);
        else router.post(imgcat.store.url(), payload, options);
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title={study ? `Editar ${study.name}` : 'Nuevo estudio'}
            description="Los estudios activos se pueden indicar desde Consulta, Emergencia y Registro."
            submitLabel={study ? 'Guardar' : 'Agregar al catálogo'}
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={!valid}
            maxWidth="sm:max-w-2xl"
        >
            <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
                    <FormField
                        name="code"
                        label="Código"
                        value={form.code}
                        onChange={(e) => set({ code: e.target.value })}
                        error={errors.code}
                        required
                    />
                    <FormField
                        name="name"
                        label="Estudio"
                        placeholder="Ej.: Sonografía de tiroides"
                        value={form.name}
                        onChange={(e) => set({ name: e.target.value })}
                        error={errors.name}
                        required
                    />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                        as="select"
                        name="modality"
                        label="Modalidad"
                        value={form.modality}
                        onChange={(e) => set({ modality: e.target.value })}
                        error={errors.modality}
                    >
                        {modalities.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </FormField>
                    <FormField
                        name="price"
                        label="Precio (RD$)"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(e) => set({ price: e.target.value })}
                        error={errors.price}
                        required
                    />
                </div>
                <FormField
                    as="textarea"
                    name="preparation"
                    label="Preparación del paciente"
                    rows={2}
                    placeholder="Ej.: Ayuno de 6 horas."
                    value={form.preparation}
                    onChange={(e) => set({ preparation: e.target.value })}
                    error={errors.preparation}
                />
                {study && (
                    <label className="flex cursor-pointer items-center gap-2 text-[14px]">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) =>
                                set({ is_active: e.target.checked })
                            }
                        />
                        Activo (se puede indicar)
                    </label>
                )}
            </div>
        </FormDialog>
    );
}
