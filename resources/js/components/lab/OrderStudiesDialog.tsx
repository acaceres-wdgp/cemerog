import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import { formatMoney } from '@/lib/money';
import StudiesPicker, { chosenStudies } from './StudiesPicker';
import type {
    ImagingCatalogItem,
    LabCatalogItem,
    StudySelection,
} from './types';

const NONE: StudySelection = { lab: [], imaging: [] };

/**
 * «Ordenar estudios» (Consulta and Emergencia): analyses and imaging. Each
 * study is charged to the account when it is done (sample taken, study
 * performed).
 */
export default function OrderStudiesDialog({
    open,
    onOpenChange,
    subtitle,
    catalog,
    imagingCatalog = [],
    url,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subtitle: string;
    catalog: LabCatalogItem[];
    imagingCatalog?: ImagingCatalogItem[];
    url: string;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [selected, setSelected] = useState<StudySelection>(NONE);
    const [indication, setIndication] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const total = chosenStudies(catalog, imagingCatalog, selected).reduce(
        (sum, c) => sum + c.price,
        0,
    );
    const count = selected.lab.length + selected.imaging.length;
    const error = Object.entries(errors).find(
        ([key]) =>
            key.startsWith('lab_test_ids') ||
            key.startsWith('imaging_study_ids'),
    )?.[1];

    const close = (value: boolean) => {
        if (!value) {
            setSelected(NONE);
            setIndication('');
        }
        onOpenChange(value);
    };

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            url,
            {
                lab_test_ids: selected.lab,
                imaging_study_ids: selected.imaging,
                indication: indication.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => close(false),
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={close}
            title="Ordenar estudios"
            description={subtitle}
            submitLabel="Enviar órdenes"
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={count === 0}
            maxWidth="sm:max-w-2xl"
        >
            <div className="flex flex-col gap-4">
                {error && <p className="m-0 text-xs text-error">{error}</p>}
                <StudiesPicker
                    labCatalog={catalog}
                    imagingCatalog={imagingCatalog}
                    selected={selected}
                    onChange={setSelected}
                />
                <FormField
                    as="textarea"
                    name="indication"
                    label="Indicación clínica"
                    rows={2}
                    placeholder="Ej.: fiebre de 3 días, descartar infección"
                    value={indication}
                    onChange={(e) => setIndication(e.target.value)}
                    error={errors.indication}
                />
                <div className="flex items-center justify-between rounded-[10px] bg-list-row-bg px-3 py-2 text-[13.5px]">
                    <span className="text-text-secondary">
                        Se carga a la cuenta al realizar cada estudio
                    </span>
                    <strong className="tabular-nums">
                        {formatMoney(total)}
                    </strong>
                </div>
            </div>
        </FormDialog>
    );
}
