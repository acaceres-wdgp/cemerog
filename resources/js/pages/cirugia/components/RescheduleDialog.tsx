import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import SurgeryFields from '@/components/cirugia/SurgeryFields';
import type { SurgeryDraft, SurgeryOptions } from '@/components/cirugia/types';
import cirugia from '@/routes/cirugia';
import type { SurgeryBlock } from '../types';

/** «Reprogramar»: new date, time, duration or operating room */
export default function RescheduleDialog({
    surgery,
    options,
    onClose,
}: {
    surgery: SurgeryBlock;
    options: SurgeryOptions;
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [draft, setDraft] = useState<SurgeryDraft>({
        surgery_procedure_id: '',
        surgeon_id: '',
        anesthetist_id: '',
        operating_room_id: String(surgery.operating_room_id),
        date: surgery.date,
        time: surgery.start,
        duration_minutes: String(surgery.duration_minutes),
    });
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.put(
            cirugia.reschedule.url(surgery.id),
            {
                operating_room_id: Number(draft.operating_room_id),
                date: draft.date,
                time: draft.time,
                duration_minutes: Number(draft.duration_minutes),
            },
            { onSuccess: onClose, onFinish: () => setIsLoading(false) },
        );
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title="Reprogramar cirugía"
            description={`${surgery.procedure} · ${surgery.patient.full_name}`}
            submitLabel="Reprogramar"
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={!draft.date || !draft.time}
        >
            <SurgeryFields
                options={options}
                value={draft}
                onChange={setDraft}
                errors={errors}
                withProcedure={false}
                withTeam={false}
            />
        </FormDialog>
    );
}
