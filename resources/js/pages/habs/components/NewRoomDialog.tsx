import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { formatMoney } from '@/lib/money';
import * as rooms from '@/routes/habs/rooms';
import type { RoomTypeRow } from '../types';

/** Nueva habitación: name, type and how many beds */
export default function NewRoomDialog({
    types,
    suggestedName,
    onClose,
}: {
    types: RoomTypeRow[];
    suggestedName: string;
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [name, setName] = useState(suggestedName);
    const [typeId, setTypeId] = useState(String(types[0]?.id ?? ''));
    const [beds, setBeds] = useState('1');
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            rooms.store.url(),
            {
                name: name.trim(),
                room_type_id: Number(typeId),
                beds: Number(beds),
            },
            {
                preserveScroll: true,
                onSuccess: onClose,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title="Nueva habitación"
            description="El tipo define el precio por día."
            submitLabel="Crear habitación"
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={name.trim() === '' || typeId === ''}
        >
            <div className="flex flex-col gap-3">
                <FormField
                    name="name"
                    label="Habitación"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    required
                />
                <FormField
                    as="select"
                    name="room_type_id"
                    label="Tipo"
                    value={typeId}
                    onChange={(e) => setTypeId(e.target.value)}
                    error={errors.room_type_id}
                >
                    {types.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name} · {formatMoney(t.daily_price)} / día
                        </option>
                    ))}
                </FormField>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium">Camas</span>
                    <SegmentedControl
                        segments={[
                            { value: '1', label: '1 cama' },
                            { value: '2', label: '2 camas' },
                            { value: '3', label: '3 camas' },
                        ]}
                        value={beds}
                        onChange={setBeds}
                    />
                </div>
            </div>
        </FormDialog>
    );
}
