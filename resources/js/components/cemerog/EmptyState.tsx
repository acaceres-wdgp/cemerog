/**
 * EmptyState – centered icon, heading, description, and optional action.
 */

import { ReactNode } from 'react';
import { LucideIcon, InboxIcon } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: ReactNode;
    className?: string;
}

export default function EmptyState({
    title,
    description,
    icon: Icon = InboxIcon,
    action,
    className = '',
}: EmptyStateProps) {
    return (
        <div
            className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
        >
            <div className="mb-4 rounded-full bg-accent-bg p-4">
                <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-text-heading">
                {title}
            </h3>
            {description && (
                <p className="mt-1 max-w-sm text-sm text-muted">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
