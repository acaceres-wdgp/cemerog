import React from 'react';
import FormField from '@/components/cemerog/FormField';
import { formatMoney } from '@/lib/money';
import type { SurgeryDraft, SurgeryOptions } from './types';

/**
 * Procedure, date, time, duration, operating room, surgeon and
 * anesthetist. `withProcedure`/`withTeam` are off when rescheduling.
 */
export default function SurgeryFields({
    options,
    value,
    onChange,
    errors,
    prefix = '',
    withProcedure = true,
    withTeam = true,
}: {
    options: SurgeryOptions;
    value: SurgeryDraft;
    onChange: (value: SurgeryDraft) => void;
    errors: Record<string, string>;
    /** «surgery.» when nested in the admission form */
    prefix?: string;
    withProcedure?: boolean;
    withTeam?: boolean;
}) {
    const set = (patch: Partial<SurgeryDraft>) =>
        onChange({ ...value, ...patch });
    const err = (k: string) => errors[`${prefix}${k}`];
    const procedure = options.procedures.find(
        (p) => String(p.id) === value.surgery_procedure_id,
    );

    return (
        <div className="flex flex-col gap-3">
            {withProcedure && (
                <FormField
                    as="select"
                    name="surgery_procedure_id"
                    label="Procedimiento"
                    required
                    value={value.surgery_procedure_id}
                    onChange={(e) => {
                        const p = options.procedures.find(
                            (x) => String(x.id) === e.target.value,
                        );
                        set({
                            surgery_procedure_id: e.target.value,
                            duration_minutes: p
                                ? String(p.duration_minutes)
                                : value.duration_minutes,
                        });
                    }}
                    error={err('surgery_procedure_id')}
                    help={
                        procedure
                            ? `${procedure.code} · ${formatMoney(procedure.price)} · se carga al realizarse`
                            : undefined
                    }
                >
                    <option value="">— Seleccionar procedimiento —</option>
                    {options.procedures.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.code} · {p.name}
                        </option>
                    ))}
                </FormField>
            )}
            <div className="grid gap-3 sm:grid-cols-4">
                <FormField
                    type="date"
                    name="date"
                    label="Fecha"
                    required
                    value={value.date}
                    onChange={(e) => set({ date: e.target.value })}
                    error={err('date')}
                />
                <FormField
                    type="time"
                    name="time"
                    label="Hora"
                    required
                    step={900}
                    value={value.time}
                    onChange={(e) => set({ time: e.target.value })}
                    error={err('time') ?? err('starts_at')}
                />
                <FormField
                    type="number"
                    name="duration_minutes"
                    label="Duración (min)"
                    required
                    min={15}
                    step={15}
                    value={value.duration_minutes}
                    onChange={(e) => set({ duration_minutes: e.target.value })}
                    error={err('duration_minutes')}
                />
                <FormField
                    as="select"
                    name="operating_room_id"
                    label="Quirófano"
                    required
                    value={value.operating_room_id}
                    onChange={(e) => set({ operating_room_id: e.target.value })}
                    error={err('operating_room_id')}
                >
                    {options.operating_rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.name}
                        </option>
                    ))}
                </FormField>
            </div>
            {withTeam && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                        as="select"
                        name="surgeon_id"
                        label="Cirujano"
                        required
                        value={value.surgeon_id}
                        onChange={(e) => set({ surgeon_id: e.target.value })}
                        error={err('surgeon_id')}
                    >
                        <option value="">— Seleccionar cirujano —</option>
                        {options.doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name} — {d.specialty}
                            </option>
                        ))}
                    </FormField>
                    <FormField
                        as="select"
                        name="anesthetist_id"
                        label="Anestesiólogo"
                        value={value.anesthetist_id}
                        onChange={(e) =>
                            set({ anesthetist_id: e.target.value })
                        }
                        error={err('anesthetist_id')}
                    >
                        <option value="">— Sin anestesiólogo —</option>
                        {options.doctors
                            .filter((d) => String(d.id) !== value.surgeon_id)
                            .map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                    </FormField>
                </div>
            )}
        </div>
    );
}
