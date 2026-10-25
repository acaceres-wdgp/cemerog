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

const VARIANT_CONFIG: Record<
    AlertVariant,
    { icon: typeof Info; variantClass: string }
> = {
    danger: { icon: XCircle, variantClass: 'alert-danger' },
    warning: { icon: AlertTriangle, variantClass: 'alert-warning' },
    info: { icon: Info, variantClass: 'alert-info' },
};

export default function AlertBanner({
    variant,
    title,
    children,
    className = '',
}: AlertBannerProps) {
    const config = VARIANT_CONFIG[variant];
    const Icon = config.icon;

    return (
        <div
            className={`flex gap-3 rounded-lg border p-4 ${config.variantClass} border-[var(--alert-border)] bg-[var(--alert-bg)] ${className}`}
            role="alert"
        >
            <Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--alert-text)]"
                aria-hidden="true"
            />
            <div className="text-sm text-[var(--alert-text)]">
                {title && (
                    <p className="font-semibold text-[var(--alert-title)]">
                        {title}
                    </p>
                )}
                <div className={title ? 'mt-1' : ''}>{children}</div>
            </div>
        </div>
    );
}
