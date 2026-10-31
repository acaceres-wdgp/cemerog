import { formatMoney } from '@/lib/money';

/** «+RD$500.00», «−RD$200.00» or «RD$0.00» */
export function differenceText(diff: number): string {
    if (diff === 0) return formatMoney(0);
    return (diff < 0 ? '−' : '+') + formatMoney(Math.abs(diff));
}

/** Green when it squares, red when short, amber when over */
export function differenceClass(diff: number): string {
    if (diff === 0) return 'text-primary';
    return diff < 0 ? 'text-error' : 'state-espera text-[var(--state-text)]';
}

export function differenceLabel(diff: number): string {
    if (diff === 0) return 'Diferencia · cuadrado';
    return diff < 0 ? 'Diferencia · faltante' : 'Diferencia · sobrante';
}

/** Units typed per face value (pesos) → total in centavos */
export function countTotal(units: Record<number, string>): number {
    return Object.entries(units).reduce(
        (sum, [value, n]) => sum + Number(value) * 100 * (parseInt(n, 10) || 0),
        0,
    );
}

/** Pesos with two decimals and thousands separator, without «RD$» */
export const plainAmount = (centavos: number) =>
    (centavos / 100).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export const cardCls =
    'rounded-[14px] border border-card-border bg-white shadow-[0_1px_2px_rgba(16,40,24,.03)]';
export const cardHeadCls =
    'flex items-center justify-between gap-3 border-b border-divider px-5 py-[14px]';
export const cardTitleCls =
    'm-0 font-serif text-[16px] font-semibold text-text-heading';
export const thCls =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
export const tdCls = 'border-b border-divider p-3 align-middle';
