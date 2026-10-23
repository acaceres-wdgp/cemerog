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
            className={`mx-auto w-full max-w-[816px] bg-white p-12 print:max-w-none print:p-0 ${className}`}
            style={{
                minHeight: '1056px',
                fontFamily: 'Instrument Sans, sans-serif',
            }}
        >
            {showHeader && (
                <div className="mb-8 flex items-center justify-between border-b border-[#e3e9e3] pb-6">
                    <div>
                        <h1
                            className="text-xl font-bold text-[#2E8B3E]"
                            style={{ fontFamily: 'Bitter, serif' }}
                        >
                            CEMEROG
                        </h1>
                        <p className="text-xs text-[#71717a]">
                            Dres. Rodríguez &amp; Guzmán
                        </p>
                    </div>
                    {title && (
                        <h2 className="text-base font-semibold text-[#1f2d22]">
                            {title}
                        </h2>
                    )}
                </div>
            )}
            <div>{children}</div>
        </div>
    );
}
