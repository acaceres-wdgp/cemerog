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
            <div className="mb-4 rounded-full bg-[#EEF6E2] p-4">
                <Icon className="h-8 w-8 text-[#2E8B3E]" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-[#1f2d22]">{title}</h3>
            {description && (
                <p className="mt-1 max-w-sm text-sm text-[#71717a]">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
