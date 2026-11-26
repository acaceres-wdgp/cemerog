import React from 'react';

export type ResultsAccess = {
    code: string;
    url: string;
    display_url: string;
    /** QR as an SVG data URI, made on the server */
    qr: string;
    expires_on: string;
};

/**
 * Printed on the invoice and the receipt of lab or imaging studies: the QR
 * that opens the results portal with the code, the link and the code.
 */
export default function ResultsAccessBox({
    access,
}: {
    access: ResultsAccess;
}) {
    return (
        <section
            aria-label="Código de resultados"
            className="mt-8 flex items-center gap-4 rounded-lg border-2 border-primary bg-white p-3"
        >
            <img
                src={access.qr}
                alt={`Código QR del portal de resultados: ${access.url}`}
                className="h-[96px] w-[96px] flex-none"
            />
            <div className="flex flex-col gap-0.5">
                <span className="text-[12px] text-secondary-fg">
                    Consulta tus resultados en
                </span>
                <span className="font-mono text-[13px] font-bold text-text-heading">
                    {access.display_url}
                </span>
                <span className="mt-0.5 text-[12px] text-secondary-fg">
                    Código:
                </span>
                <span className="font-mono text-[20px] font-bold tracking-[.08em] text-primary">
                    {access.code}
                </span>
                <span className="text-[11px] text-muted">
                    Con tu fecha de nacimiento · válido hasta el{' '}
                    {access.expires_on}
                </span>
            </div>
        </section>
    );
}
