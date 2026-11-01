import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import { parseMoney } from '@/lib/money';
import * as analisis from '@/routes/analisis';
import type { LabTestRow } from '../types';
import ParametersEditor, { emptyParameter } from './ParametersEditor';
import type { ParameterDraft } from './ParametersEditor';

const num = (v: string) =>
    v.trim() === '' ? null : Number(v.replace(',', '.'));

/** Nuevo análisis / Editar análisis */
export default function LabTestDialog({
    test,
    categories,
    onClose,
}: {
    test: LabTestRow | null;
    categories: string[];
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [form, setForm] = useState({
        code: test?.code ?? '',
        name: test?.name ?? '',
        category: test?.category ?? categories[0] ?? '',
        preparation: test?.preparation ?? '',
        price: test ? (test.price / 100).toFixed(2) : '',
        is_active: test?.is_active ?? true,
    });
    const [parameters, setParameters] = useState<ParameterDraft[]>(() =>
        test
            ? test.parameters.map((p) => ({
                  ...emptyParameter(),
                  name: p.name,
                  result_type: p.result_type,
                  unit: p.unit ?? '',
                  min: p.min !== null ? String(p.min) : '',
                  max: p.max !== null ? String(p.max) : '',
                  normal_text: p.normal_text ?? '',
              }))
            : [emptyParameter()],
    );
    const [isLoading, setIsLoading] = useState(false);
    const set = (patch: Partial<typeof form>) =>
        setForm((f) => ({ ...f, ...patch }));
    const valid =
        form.code.trim() !== '' &&
        form.name.trim() !== '' &&
        form.price.trim() !== '' &&
        parameters.every((p) => p.name.trim() !== '');

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const payload = {
            code: form.code.trim(),
            name: form.name.trim(),
            category: form.category,
            preparation: form.preparation.trim() || null,
            price: parseMoney(form.price),
            ...(test ? { is_active: form.is_active } : {}),
            parameters: parameters.map((p) =>
                p.result_type === 'texto'
                    ? {
                          name: p.name.trim(),
                          result_type: 'texto',
                          normal_text: p.normal_text.trim() || null,
                      }
                    : {
                          name: p.name.trim(),
                          result_type: 'numerico',
                          unit: p.unit.trim() || null,
                          min: num(p.min),
                          max: num(p.max),
                      },
            ),
        };
        const options = {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setIsLoading(false),
        };
        if (test) router.put(analisis.update.url(test.id), payload, options);
        else router.post(analisis.store.url(), payload, options);
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title={test ? `Editar ${test.name}` : 'Nuevo análisis'}
            description="Los análisis activos se pueden ordenar desde Consulta y Emergencia."
            submitLabel={test ? 'Guardar' : 'Agregar al catálogo'}
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={!valid}
            maxWidth="sm:max-w-3xl"
        >
            <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-[110px_1fr_180px_140px]">
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
                        label="Análisis"
                        value={form.name}
                        onChange={(e) => set({ name: e.target.value })}
                        error={errors.name}
                        required
                    />
                    <FormField
                        as="select"
                        name="category"
                        label="Categoría"
                        value={form.category}
                        onChange={(e) => set({ category: e.target.value })}
                        error={errors.category}
                    >
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
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
                    placeholder="Ej.: Ayuno de 8 a 12 horas. Puede tomar agua."
                    value={form.preparation}
                    onChange={(e) => set({ preparation: e.target.value })}
                    error={errors.preparation}
                />
                <ParametersEditor
                    value={parameters}
                    errors={errors}
                    onChange={setParameters}
                />
                {test && (
                    <label className="flex cursor-pointer items-center gap-2 text-[14px]">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) =>
                                set({ is_active: e.target.checked })
                            }
                        />
                        Activo (se puede ordenar)
                    </label>
                )}
            </div>
        </FormDialog>
    );
}
