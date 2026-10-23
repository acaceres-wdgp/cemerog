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
            className={`rounded-lg border border-[#e3e9e3] bg-white shadow-sm ${className}`}
        >
            {hasHeader && (
                <div className="flex items-center justify-between border-b border-[#e3e9e3] bg-[#F6FAF1] px-5 py-3">
                    <div>
                        {title && (
                            <h2
                                className="text-sm font-semibold tracking-wide text-[#56693f] uppercase"
                                style={{ fontSize: '11.5px' }}
                            >
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-0.5 text-xs text-[#71717a]">
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
