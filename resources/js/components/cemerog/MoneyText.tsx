/**
 * MoneyText – formats centavos as DOP currency string.
 * Value must be stored as integer centavos.
 */

import { formatMoney } from '@/lib/money';

interface MoneyTextProps {
    centavos: number;
    className?: string;
    /** Emphasize negative values in red */
    colorize?: boolean;
}

export default function MoneyText({ centavos, className = '', colorize = false }: MoneyTextProps) {
    const isNegative = centavos < 0;
    const colorClass = colorize ? (isNegative ? 'text-[#b91c1c]' : '') : '';

    return (
        <span className={`font-medium tabular-nums ${colorClass} ${className}`}>
            {formatMoney(centavos)}
        </span>
    );
}
