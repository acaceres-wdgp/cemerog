import React from 'react';
import StudiesPicker, { chosenStudies } from '@/components/lab/StudiesPicker';
import type {
    ImagingCatalogItem,
    LabCatalogItem,
    StudySelection,
} from '@/components/lab/types';
import { formatMoney } from '@/lib/money';

/** «Solo análisis o imágenes»: who indicates them and which studies */
export function StudiesAttention({
    labCatalog,
    imagingCatalog,
    selected,
    externalDoctor,
    onChange,
    onExternalDoctor,
    errors,
}: {
    labCatalog: LabCatalogItem[];
    imagingCatalog: ImagingCatalogItem[];
    selected: StudySelection;
    externalDoctor: string;
    onChange: (selected: StudySelection) => void;
    onExternalDoctor: (value: string) => void;
    errors: Partial<Record<string, string>>;
}) {
    const studyError = Object.entries(errors).find(
        ([key]) =>
            key.startsWith('lab_test_ids') ||
            key.startsWith('imaging_study_ids'),
    )?.[1];

    return (
        <div className="flex flex-col gap-4">
            <div>
                <label
                    htmlFor="field-external-doctor"
                    className="mb-1 block text-[13px] font-medium text-text-body"
                >
                    Médico que indica
                </label>
                <input
                    id="field-external-doctor"
                    value={externalDoctor}
                    onChange={(e) => onExternalDoctor(e.target.value)}
                    placeholder="Opcional · puede ser un médico externo"
                    className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary"
                />
                {errors.external_doctor && (
                    <p className="mt-1 text-[12px] text-error">
                        {errors.external_doctor}
                    </p>
                )}
            </div>
            {studyError && (
                <p className="m-0 text-[12px] text-error">{studyError}</p>
            )}
            <StudiesPicker
                labCatalog={labCatalog}
                imagingCatalog={imagingCatalog}
                selected={selected}
                onChange={onChange}
            />
        </div>
    );
}

/** Resumen lines for the selected studies */
export function StudiesSummary({
    labCatalog,
    imagingCatalog,
    selected,
}: {
    labCatalog: LabCatalogItem[];
    imagingCatalog: ImagingCatalogItem[];
    selected: StudySelection;
}) {
    const chosen = chosenStudies(labCatalog, imagingCatalog, selected);
    const total = chosen.reduce((sum, c) => sum + c.price, 0);

    return (
        <div className="flex flex-col gap-1.5 px-5 py-3">
            {chosen.length === 0 ? (
                <p className="m-0 text-text-tertiary">
                    Selecciona al menos un estudio.
                </p>
            ) : (
                chosen.map((c) => (
                    <div key={c.name} className="flex justify-between gap-3">
                        <span className="text-text-body">{c.name}</span>
                        <span className="tabular-nums">
                            {formatMoney(c.price)}
                        </span>
                    </div>
                ))
            )}
            <div className="mt-1 flex justify-between font-semibold text-text-heading">
                <span>Cargo al realizar los estudios</span>
                <span className="tabular-nums">{formatMoney(total)}</span>
            </div>
            <p className="m-0 text-[12px] text-muted">
                Pasa a realizarse los estudios y luego paga en caja. Los
                resultados quedan en su expediente.
            </p>
        </div>
    );
}
