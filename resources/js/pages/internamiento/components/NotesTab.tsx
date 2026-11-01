import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import internamiento from '@/routes/internamiento';

export type NursingNote = {
    id: number;
    body: string;
    shift: string;
    author: string;
    at: string;
};

const initials = (name: string) =>
    name
        .replace(/^(Lic\.|Dr\.|Dra\.)\s+/, '')
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('');

/** «Notas de enfermería»: a new note and the history */
export default function NotesTab({
    admissionId,
    notes,
    active,
    author,
    shift,
}: {
    admissionId: number;
    notes: NursingNote[];
    active: boolean;
    author: string;
    shift: string;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [body, setBody] = useState('');

    const save = () =>
        router.post(
            internamiento.notes.store.url(admissionId),
            { body: body.trim() },
            { preserveScroll: true, onSuccess: () => setBody('') },
        );

    return (
        <div className="flex flex-wrap items-start gap-4">
            {active && (
                <section className="min-w-0 flex-[1_1_300px] rounded-[14px] border border-card-border bg-white">
                    <div className="border-b border-divider px-5 py-3">
                        <div className="font-serif text-[16px] font-semibold text-text-heading">
                            Nueva nota
                        </div>
                        <div className="text-[13px] text-muted">
                            {author} · Turno {shift}
                        </div>
                    </div>
                    <div className="px-5 py-4">
                        <textarea
                            rows={6}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            aria-label="Nueva nota"
                            placeholder="Estado del paciente, cuidados realizados, eventualidades…"
                            className="w-full rounded-[10px] border border-input-border px-3 py-2 outline-none focus:border-primary"
                        />
                        {errors.body && (
                            <p className="m-0 text-[12px] text-error">
                                {errors.body}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end border-t border-divider px-5 py-3">
                        <button
                            type="button"
                            disabled={body.trim() === ''}
                            onClick={save}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover disabled:bg-primary-disabled"
                        >
                            <Check className="h-4 w-4" />
                            Guardar nota
                        </button>
                    </div>
                </section>
            )}
            <section className="min-w-0 flex-[2_1_420px] rounded-[14px] border border-card-border bg-white">
                <div className="flex items-baseline justify-between border-b border-divider px-5 py-3">
                    <div className="font-serif text-[16px] font-semibold text-text-heading">
                        Notas de enfermería
                    </div>
                    <span className="text-[13px] text-muted">
                        {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
                    </span>
                </div>
                {notes.length === 0 && (
                    <p className="m-0 px-5 py-6 text-center text-[13px] text-muted">
                        Aún no hay notas en esta estancia.
                    </p>
                )}
                {notes.map((n) => (
                    <div
                        key={n.id}
                        className="flex gap-3 border-b border-divider px-5 py-3 last:border-b-0"
                    >
                        <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-bg text-[12px] font-semibold text-primary">
                            {initials(n.author)}
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-baseline gap-2 text-[13px]">
                                <strong>{n.author}</strong>
                                <span className="text-muted">
                                    Turno {n.shift}
                                </span>
                                <span className="text-muted tabular-nums">
                                    {n.at}
                                </span>
                            </div>
                            <p className="m-0 mt-0.5 text-[13.5px] whitespace-pre-line">
                                {n.body}
                            </p>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}
