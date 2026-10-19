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

export default function StatCard({ label, value, icon: Icon, trend, className = '' }: StatCardProps) {
    return (
        <div
            className={`rounded-lg border border-[#e3e9e3] bg-white p-5 shadow-sm ${className}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#56693f]">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-[#1f2d22]">{value}</p>
                    {trend && (
                        <p
                            className={`mt-1 text-xs ${trend.value >= 0 ? 'text-[#2E8B3E]' : 'text-[#b91c1c]'}`}
                        >
                            {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className="rounded-lg bg-[#EEF6E2] p-2.5">
                        <Icon className="h-5 w-5 text-[#2E8B3E]" aria-hidden="true" />
                    </div>
                )}
            </div>
        </div>
    );
}
