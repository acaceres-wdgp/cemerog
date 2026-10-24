/**
 * Panel – card with optional header, actions, and body.
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
    title?: string;
    description?: string;
    headerActions?: ReactNode;
    children: ReactNode;
    className?: string;
    noPadding?: boolean;
    noShadow?: boolean;
}

export default function Panel({
    title,
    description,
    headerActions,
    children,
    className = '',
    noPadding = false,
    noShadow = false,
}: PanelProps) {
    const hasHeader = title || description || headerActions;

    return (
        <div
            className={cn(
                'rounded-[14px] border border-card-border bg-white',
                !noShadow && 'shadow-[0_1px_2px_rgba(16,40,24,.03)]',
                className,
            )}
        >
            {hasHeader && (
                <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
                    <div>
                        {title && (
                            <h2 className="font-serif text-base font-semibold text-text-heading">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-0.5 text-[13px] text-muted">
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
