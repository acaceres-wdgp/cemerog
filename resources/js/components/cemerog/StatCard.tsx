/**
 * StatCard – displays a single KPI metric with label and optional trend.
 */

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: { value: number; label: string };
    className?: string;
}

export default function StatCard({
    label,
    value,
    icon: Icon,
    trend,
    className = '',
}: StatCardProps) {
    return (
        <div
            className={`rounded-lg border border-card-border bg-white p-5 shadow-sm ${className}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-table-header-text uppercase">
                        {label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-text-heading">
                        {value}
                    </p>
                    {trend && (
                        <p
                            className={`mt-1 text-xs ${trend.value >= 0 ? 'text-primary' : 'text-error'}`}
                        >
                            {trend.value >= 0 ? '▲' : '▼'}{' '}
                            {Math.abs(trend.value)}% {trend.label}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className="rounded-lg bg-accent-bg p-2.5">
                        <Icon
                            className="h-5 w-5 text-primary"
                            aria-hidden="true"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
