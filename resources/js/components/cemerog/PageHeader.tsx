/**
 * PageHeader – standardized page title, subtitle, and action slot.
 */

import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    className?: string;
}

export default function PageHeader({
    title,
    subtitle,
    actions,
    className = '',
}: PageHeaderProps) {
    return (
        <div className={`flex items-start justify-between py-4 ${className}`}>
            <div>
                <h1 className="text-xl font-semibold text-text-heading">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2">{actions}</div>
            )}
        </div>
    );
}
