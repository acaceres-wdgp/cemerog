import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { conflict } from '@/lib/allergy';
import { TurnItem, PrescriptionData } from '../types';
import { buildInstruction } from '../lib/instructionBuilder';
import { thCls } from '../lib/helpers';
import RecetaRow from './RecetaRow';
import AllergyAlert from './AllergyAlert';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RxRow = {
    key: number;
    medication: string;
    route: string;
    dose: string;
    frequency: string;
    duration_days: string;
    is_continuous: boolean;
    quantity: string;
};

type Props = {
    turn: TurnItem;
    prescription: PrescriptionData | null;
    isDischargedTurn: boolean;
};

// ─── Allergy helpers ─────────────────────────────────────────────────────────

function findAllergyConflict(
    rows: RxRow[],
    allergies: string | null,
): string | null {
    if (!allergies) return null;
    for (const row of rows) {
        if (row.medication && conflict(allergies, row.medication)) {
            return row.medication;
        }
    }
    return null;
}

// ─── RecetaTab ────────────────────────────────────────────────────────────────

let keyCounter = 2;

export default function RecetaTab({
    turn,
    prescription,
    isDischargedTurn,
}: Props) {
    const { errors } = usePage().props as { errors: Record<string, string> };

    const [rows, setRows] = useState<RxRow[]>(() => {
        if (prescription && prescription.items.length > 0) {
            return prescription.items.map((item) => ({
                key: item.id,
                medication: item.medication,
                route: item.route ?? '',
                dose: item.dose,
                frequency: item.frequency,
                duration_days: item.duration_days?.toString() ?? '',
                is_continuous: item.is_continuous,
                quantity: item.quantity.toString(),
            }));
        }
        return [
            {
                key: 1,
                medication: '',
                route: '',
                dose: '',
                frequency: '',
                duration_days: '',
                is_continuous: false,
                quantity: '',
            },
        ];
    });

    const [generalInstructions, setGeneralInstructions] = useState(
        prescription?.general_instructions ?? '',
    );
    const [savedPrescriptionId, setSavedPrescriptionId] = useState<
        number | null
    >(prescription?.id ?? null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const allergyConflict = findAllergyConflict(rows, turn.patient.allergies);
    const saveError = errors?.allergy
        ? String(errors.allergy)
        : errors?.turn_id
          ? String(errors.turn_id)
          : null;

    const markDirty = () => setIsDirty(true);

    function updateRow(index: number, patch: Partial<RxRow>) {
        setRows((prev) =>
            prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        );
        markDirty();
    }

    function addRow() {
        setRows((prev) => [
            ...prev,
            {
                key: keyCounter++,
                medication: '',
                route: '',
                dose: '',
                frequency: '',
                duration_days: '',
                is_continuous: false,
                quantity: '',
            },
        ]);
        markDirty();
    }

    function removeRow(index: number) {
        setRows((prev) => prev.filter((_, i) => i !== index));
        markDirty();
    }

    function handleSave() {
        if (allergyConflict || isSaving) return;
        setIsSaving(true);

        const payload = {
            general_instructions: generalInstructions || null,
            items: rows.map((row, i) => ({
                position: i + 1,
                medication: row.medication,
                route: row.route || null,
                dose: row.dose,
                frequency: row.frequency,
                duration_days: row.is_continuous
                    ? null
                    : row.duration_days
                      ? parseInt(row.duration_days, 10)
                      : null,
                is_continuous: row.is_continuous,
                quantity: parseInt(row.quantity, 10) || 0,
            })),
        };

        const url = `/consulta/turnos/${turn.id}/receta`;
        const method = savedPrescriptionId ? router.put : router.post;

        method(url, payload, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // If this was a first-time save, update savedPrescriptionId from the
                // reloaded prescriptions prop (Inertia redirect back re-renders page).
                setIsDirty(false);
                // For first saves: the turn's prescription now exists on the page,
                // but we know the id from the prescription prop. We mark it saved.
                setSavedPrescriptionId((prev) => prev ?? -1);
            },
            onFinish: () => setIsSaving(false),
        });
    }

    function handlePrint() {
        if (!savedPrescriptionId) return;
        window.open(
            `/consulta/recetas/${savedPrescriptionId}/imprimir`,
            '_blank',
        );
    }

    const count = rows.length;
    const countLabel = `${count} medicamentos`;
    const canPrint = !!savedPrescriptionId && !isDirty;
    const statusLabel = isDirty
        ? 'Sin guardar'
        : savedPrescriptionId
          ? 'Guardado'
          : 'Sin guardar';
    const canSave = !allergyConflict && !isSaving && !isDischargedTurn;

    return (
        <div className="rounded-[14px] border border-card-border bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-[14px]">
                <div>
                    <div className="font-serif text-[16px] font-semibold text-text-heading">
                        Receta
                    </div>
                    <div className="text-[13px] text-muted">{countLabel}</div>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                    <span
                        className={cn(
                            'font-medium',
                            statusLabel === 'Guardado'
                                ? 'text-primary'
                                : 'text-muted',
                        )}
                    >
                        {statusLabel}
                    </span>
                </div>
            </div>

            {allergyConflict && <AllergyAlert medication={allergyConflict} />}

            {saveError && (
                <div className="mx-[18px] mb-3 rounded-[10px] border border-error bg-error-bg px-[14px] py-[10px] text-[13px] text-error">
                    {saveError}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse">
                    <thead>
                        <tr>
                            <th className={cn(thCls, 'w-[28%] pl-[18px]')}>
                                Medicamento
                            </th>
                            <th className={cn(thCls, 'w-[10%]')}>Vía</th>
                            <th className={cn(thCls, 'w-[14%]')}>Dosis</th>
                            <th className={cn(thCls, 'w-[20%]')}>Frecuencia</th>
                            <th className={cn(thCls, 'w-[16%]')}>
                                Duración (días)
                            </th>
                            <th className={cn(thCls, 'w-[8%]')}>Cantidad</th>
                            <th className={cn(thCls, 'w-10')}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <RecetaRow
                                key={row.key}
                                row={row}
                                index={i}
                                disabled={isDischargedTurn}
                                onChange={(patch) => updateRow(i, patch)}
                                onRemove={() => removeRow(i)}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="border-b border-divider px-[18px] py-[10px]">
                <button
                    onClick={addRow}
                    disabled={isDischargedTurn}
                    className="inline-flex h-[34px] cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-accent-border bg-list-row-bg px-3 font-sans text-sm font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    + Agregar medicamento
                </button>
            </div>

            <div className="px-[18px] py-3">
                <label className="mb-1 block text-[12px] font-semibold tracking-[.05em] text-muted uppercase">
                    Indicaciones generales
                </label>
                <textarea
                    value={generalInstructions}
                    onChange={(e) => {
                        setGeneralInstructions(e.target.value);
                        markDirty();
                    }}
                    disabled={isDischargedTurn}
                    rows={3}
                    placeholder="Indicaciones adicionales para el paciente..."
                    className="w-full rounded-[10px] border border-input-border px-[12px] py-[8px] font-sans text-[13.5px] outline-none disabled:bg-surface disabled:text-muted"
                />
            </div>

            <div className="flex justify-end gap-2 border-t border-divider px-[18px] py-3">
                <button
                    onClick={handlePrint}
                    disabled={!canPrint}
                    aria-label="Imprimir receta"
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-4 font-sans text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Imprimir receta
                </button>
                <button
                    onClick={handleSave}
                    disabled={!canSave}
                    aria-label="Guardar receta"
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-primary px-4 font-sans text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving ? 'Guardando...' : '✓ Guardar receta'}
                </button>
            </div>
        </div>
    );
}

export { buildInstruction };
