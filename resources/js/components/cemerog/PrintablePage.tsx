/**
 * PrintablePage – wrapper for printable letter-size documents.
 * Use with window.print() or a print button.
 */

import { ReactNode } from 'react';

interface PrintablePageProps {
    children: ReactNode;
    title?: string;
    showHeader?: boolean;
    className?: string;
}

export default function PrintablePage({
    children,
    title,
    showHeader = true,
    className = '',
}: PrintablePageProps) {
    return (
        <div
            className={`mx-auto min-h-[1056px] w-full max-w-[816px] bg-white p-12 font-sans print:max-w-none print:p-0 ${className}`}
        >
            {showHeader && (
                <div className="mb-8 flex items-center justify-between border-b border-card-border pb-6">
                    <div>
                        <h1 className="font-serif text-xl font-bold text-primary">
                            CEMEROG
                        </h1>
                        <p className="text-xs text-muted">
                            Dres. Rodríguez &amp; Guzmán
                        </p>
                    </div>
                    {title && (
                        <h2 className="text-base font-semibold text-text-heading">
                            {title}
                        </h2>
                    )}
                </div>
            )}
            <div>{children}</div>
        </div>
    );
}
