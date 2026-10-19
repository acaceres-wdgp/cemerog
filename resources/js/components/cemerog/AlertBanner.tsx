/**
 * AlertBanner – inline alert for danger, warning, or info messages.
 */

import { ReactNode } from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

type AlertVariant = 'danger' | 'warning' | 'info';

interface AlertBannerProps {
    variant: AlertVariant;
    title?: string;
    children: ReactNode;
    className?: string;
}

const VARIANT_CONFIG: Record<AlertVariant, { icon: typeof Info; bg: string; border: string; text: string; titleText: string }> = {
    danger:  { icon: XCircle,       bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', titleText: '#991b1b' },
    warning: { icon: AlertTriangle, bg: '#FEF3C7', border: '#D97706', text: '#92400E', titleText: '#78350f' },
    info:    { icon: Info,          bg: '#DBEAFE', border: '#93c5fd', text: '#1E40AF', titleText: '#1d4ed8' },
};

export default function AlertBanner({ variant, title, children, className = '' }: AlertBannerProps) {
    const config = VARIANT_CONFIG[variant];
    const Icon = config.icon;

    return (
        <div
            className={`flex gap-3 rounded-lg border p-4 ${className}`}
            style={{ backgroundColor: config.bg, borderColor: config.border }}
            role="alert"
        >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: config.text }} aria-hidden="true" />
            <div className="text-sm" style={{ color: config.text }}>
                {title && (
                    <p className="font-semibold" style={{ color: config.titleText }}>{title}</p>
                )}
                <div className={title ? 'mt-1' : ''}>{children}</div>
            </div>
        </div>
    );
}
