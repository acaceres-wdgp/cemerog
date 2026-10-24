/**
 * Panel – card with optional header, actions, and body.
 */

import { ReactNode } from 'react';

interface PanelProps {
    title?: string;
    description?: string;
    headerActions?: ReactNode;
    children: ReactNode;
    className?: string;
    noPadding?: boolean;
}

export default function Panel({
    title,
    description,
    headerActions,
    children,
    className = '',
    noPadding = false,
}: PanelProps) {
    const hasHeader = title || description || headerActions;

    return (
        <div
            className={`rounded-[14px] border border-[#e3e9e3] bg-white shadow-[0_1px_2px_rgba(16,40,24,.03)] ${className}`}
        >
            {hasHeader && (
                <div className="flex items-center justify-between border-b border-[#e3e9e3] px-5 py-4">
                    <div>
                        {title && (
                            <h2
                                className="font-semibold text-[#1f2d22]"
                                style={{ fontFamily: 'Bitter, serif', fontSize: '16px' }}
                            >
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-0.5 text-[#71717a]" style={{ fontSize: '13px' }}>
                                {description}
                            </p>
                        )}
                    </div>
                    {headerActions && (
                        <div className="flex items-center gap-2">
                            {headerActions}
                        </div>
                    )}
                </div>
            )}
            <div className={noPadding ? '' : 'p-5'}>{children}</div>
        </div>
    );
}
