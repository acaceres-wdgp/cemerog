import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import PatientSearch from '@/components/cemerog/PatientSearch';
import type { PatientResult } from '@/components/cemerog/PatientSearch';
import SurgeryFields from '@/components/cirugia/SurgeryFields';
import {
    draftComplete,
    draftPayload,
    emptyDraft,
} from '@/components/cirugia/types';
import type { SurgeryOptions } from '@/components/cirugia/types';
import cirugia from '@/routes/cirugia';

/** «Programar cirugía»: the patient, the procedure and the slot */
export default function ScheduleDialog({
    options,
    date,
    onClose,
}: {
    options: SurgeryOptions;
    date: string;
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [patient, setPatient] = useState<PatientResult | null>(null);
    const [query, setQuery] = useState('');
    const [draft, setDraft] = useState(() => emptyDraft(options, date));
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            cirugia.store.url(),
            {
                patient_id: patient?.id,
                ...draftPayload(draft),
                notes: notes.trim() || null,
            },
            { onSuccess: onClose, onFinish: () => setIsLoading(false) },
        );
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title="Programar cirugía"
            description="Ambulatoria; si el paciente está internado, queda en su estancia."
            submitLabel="Programar"
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={!patient || !draftComplete(draft)}
            maxWidth="sm:max-w-2xl"
        >
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium">Paciente *</span>
                    <PatientSearch
                        selected={patient}
                        query={query}
                        onQueryChange={setQuery}
                        onSelect={(p) => {
                            setPatient(p);
                            setQuery('');
                        }}
                        onClear={() => setPatient(null)}
                        error={errors.patient_id}
                        endpoint={cirugia.pacientes.buscar.url()}
                        placeholder="Buscar por nombre, cédula o expediente…"
                    />
                </div>
                <SurgeryFields
                    options={options}
                    value={draft}
                    onChange={setDraft}
                    errors={errors}
                />
                <FormField
                    as="textarea"
                    name="notes"
                    label="Notas"
                    rows={2}
                    placeholder="Ej.: ayuno desde las 22:00, reservar sangre"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    error={errors.notes}
                />
            </div>
        </FormDialog>
    );
}
