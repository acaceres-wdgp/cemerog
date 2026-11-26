import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    BellRing,
    CircleAlert,
    Download,
    Receipt,
    ShieldCheck,
} from 'lucide-react';
import type { ClinicInfo } from '@/components/cemerog/ClinicHeader';
import { cn } from '@/lib/utils';
import { formatBirthDate, formatCode, isComplete } from '@/lib/result-code';
import portal from '@/routes/portal';
import CodeHelpDialog from './components/CodeHelpDialog';

type AccessError =
    | { type: 'incompleto' }
    | { type: 'datos'; remaining: number }
    | { type: 'bloqueado' }
    | { type: 'vencido'; date: string };

const STEPS = [
    {
        icon: Receipt,
        title: 'Recibe tu código',
        text: 'Al pagar tus análisis o estudios de imágenes, el código viene impreso en tu factura.',
    },
    {
        icon: BellRing,
        title: 'Espera los resultados',
        text: 'Aparecen aquí en cuanto el laboratorio o el radiólogo los validan.',
    },
    {
        icon: Download,
        title: 'Míralos y descárgalos',
        text: 'Entra con tu código y tu fecha de nacimiento. Puedes bajarlos en PDF.',
    },
];

function errorText(error: AccessError): {
    title: string;
    text: string;
    warn: boolean;
} {
    switch (error.type) {
        case 'incompleto':
            return {
                title: 'Faltan datos.',
                text: 'Escribe el código completo (8 caracteres) y la fecha como DD/MM/AAAA.',
                warn: true,
            };
        case 'datos':
            return {
                title: 'No encontramos resultados con esos datos.',
                text: `Revisa el código y la fecha de nacimiento. Te ${error.remaining === 1 ? 'queda' : 'quedan'} ${error.remaining} ${error.remaining === 1 ? 'intento' : 'intentos'}.`,
                warn: false,
            };
        case 'bloqueado':
            return {
                title: 'Demasiados intentos.',
                text: 'Por seguridad, espera 15 minutos antes de volver a intentarlo, o pide ayuda en recepción.',
                warn: false,
            };
        case 'vencido':
            return {
                title: `Este código venció el ${error.date}.`,
                text: 'Pide uno nuevo en recepción presentando tu cédula; tus resultados siguen guardados.',
                warn: true,
            };
    }
}

/** Results portal › access with the code of the invoice and the birth date */
export default function PortalAcceso({
    prefill = '',
    locked = false,
    expired = false,
    clinic,
}: {
    prefill?: string;
    locked?: boolean;
    expired?: boolean;
    clinic?: ClinicInfo;
}) {
    const flash = usePage().flash as { access_error?: AccessError } | undefined;
    const [code, setCode] = useState(() => formatCode(prefill));
    const [birthDate, setBirthDate] = useState('');
    const [localError, setLocalError] = useState<AccessError | null>(null);
    const [sending, setSending] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    // The server's answer hides once the patient types again
    const [typed, setTyped] = useState(false);

    const serverError = flash?.access_error ?? null;
    const error = localError ?? (typed ? null : serverError);
    const blocked = locked || serverError?.type === 'bloqueado';

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (sending || blocked) return;
        if (!isComplete(code, birthDate)) {
            setLocalError({ type: 'incompleto' });
            return;
        }
        setLocalError(null);
        setTyped(false);
        setSending(true);
        router.post(
            portal.access.url(),
            { code, birth_date: birthDate },
            { preserveScroll: true, onFinish: () => setSending(false) },
        );
    };
    const shown = error ? errorText(error) : null;
    const input =
        'h-[50px] w-full rounded-xl border bg-white px-[14px] outline-none focus:border-primary focus:ring-3 focus:ring-primary/20';
    const border =
        error?.type === 'datos'
            ? 'border-error-border'
            : 'border-secondary-border';

    return (
        <div className="flex flex-wrap items-start justify-center gap-6 pt-2">
            <section
                aria-labelledby="t-acceso"
                className="flex max-w-[440px] flex-[1_1_360px] flex-col gap-[18px] rounded-[18px] border border-card-border bg-white p-7 shadow-[0_12px_40px_-16px_rgba(16,40,24,.18)] max-sm:p-5"
            >
                <div>
                    <h1
                        id="t-acceso"
                        className="m-0 font-serif text-[24px] font-semibold text-text-heading"
                    >
                        Consulta tus resultados
                    </h1>
                    <p className="mt-1 mb-0 text-secondary-fg">
                        Escribe el código que aparece en tu factura y tu fecha
                        de nacimiento.
                    </p>
                </div>
                {expired && !error && (
                    <p className="m-0 rounded-[10px] border border-success-border bg-accent-bg px-3 py-[10px] text-[14px] text-accent-fg">
                        Tu sesión se cerró por seguridad. Entra de nuevo para
                        ver tus resultados.
                    </p>
                )}
                <form
                    onSubmit={submit}
                    className="flex flex-col gap-[18px]"
                    noValidate
                >
                    <label className="flex flex-col gap-1.5">
                        <span className="font-semibold text-text-heading">
                            Código de resultados
                        </span>
                        <input
                            name="code"
                            value={code}
                            onChange={(e) => {
                                setCode(formatCode(e.target.value));
                                setLocalError(null);
                                setTyped(true);
                            }}
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            placeholder="CMG-0000-0000"
                            aria-describedby="h-codigo"
                            className={cn(
                                input,
                                border,
                                'font-mono text-[19px] tracking-[.08em] uppercase',
                            )}
                        />
                        <span
                            id="h-codigo"
                            className="text-[13px] text-text-secondary"
                        >
                            Son 8 letras y números. No importa si usas
                            mayúsculas o minúsculas.
                        </span>
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="font-semibold text-text-heading">
                            Fecha de nacimiento del paciente
                        </span>
                        <input
                            name="birth_date"
                            value={birthDate}
                            onChange={(e) => {
                                setBirthDate(formatBirthDate(e.target.value));
                                setLocalError(null);
                                setTyped(true);
                            }}
                            inputMode="numeric"
                            autoComplete="bday"
                            placeholder="DD/MM/AAAA"
                            className={cn(
                                input,
                                border,
                                'text-[18px] tabular-nums',
                            )}
                        />
                    </label>
                    {shown && (
                        <div
                            role="alert"
                            className={cn(
                                'flex items-start gap-[10px] rounded-[10px] border px-3 py-[11px] text-[14px]',
                                shown.warn
                                    ? 'state-espera border-[var(--state-accent)]/40 bg-[var(--state-bg)] text-[var(--state-text)]'
                                    : 'border-error-border bg-error-bg text-error-strong',
                            )}
                        >
                            <CircleAlert
                                aria-hidden
                                className="mt-0.5 h-[17px] w-[17px] flex-none"
                            />
                            <span>
                                <b>{shown.title}</b> {shown.text}
                            </span>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={blocked || sending}
                        className="inline-flex h-[50px] cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-primary text-[16px] font-semibold text-white shadow-sm hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-primary-disabled"
                    >
                        {sending
                            ? 'Verificando…'
                            : blocked
                              ? 'Intenta en 15 minutos'
                              : 'Ver mis resultados'}
                    </button>
                </form>
                <button
                    type="button"
                    onClick={() => setHelpOpen(true)}
                    className="cursor-pointer self-center border-0 bg-transparent p-1 text-[14px] font-medium text-primary underline underline-offset-[3px]"
                >
                    ¿Dónde encuentro mi código?
                </button>
            </section>

            <aside
                aria-label="Cómo funciona"
                className="flex max-w-[360px] flex-[1_1_280px] flex-col gap-[14px] pt-1.5"
            >
                <h2 className="m-0 text-[15px] font-semibold text-text-heading">
                    Cómo funciona
                </h2>
                {STEPS.map((s) => (
                    <div key={s.title} className="flex items-start gap-3">
                        <span
                            aria-hidden
                            className="inline-flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-accent-bg text-primary"
                        >
                            <s.icon className="h-[17px] w-[17px]" />
                        </span>
                        <div>
                            <div className="font-semibold text-text-heading">
                                {s.title}
                            </div>
                            <div className="text-[14px] text-secondary-fg">
                                {s.text}
                            </div>
                        </div>
                    </div>
                ))}
                <div className="mt-1 flex gap-[10px] rounded-xl border border-card-border bg-white px-[14px] py-3 text-[13.5px] text-secondary-fg">
                    <ShieldCheck
                        aria-hidden
                        className="mt-0.5 h-4 w-4 flex-none text-primary"
                    />
                    <span>
                        Tus resultados son confidenciales. No compartas tu
                        código.
                        {clinic?.phone && (
                            <>
                                {' '}
                                ¿Necesitas ayuda? Llama al{' '}
                                <b className="text-text-heading">
                                    {clinic.phone}
                                </b>
                                .
                            </>
                        )}
                    </span>
                </div>
            </aside>

            <CodeHelpDialog
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
                clinic={clinic}
            />
        </div>
    );
}
