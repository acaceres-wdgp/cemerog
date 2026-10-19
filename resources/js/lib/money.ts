/**
 * Money utilities for CEMEROG.
 * All monetary values are stored as integers (centavos).
 * Display format: RD$1,000.00
 */

/**
 * Format centavos to a human-readable DOP currency string.
 * @param centavos - integer amount in centavos (e.g. 150050 = RD$1,500.50)
 */
export function formatMoney(centavos: number): string {
    const amount = centavos / 100;
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        currencyDisplay: 'symbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Parse a formatted currency string back to centavos.
 * @param value - e.g. "RD$1,500.50" or "1500.50"
 */
export function parseMoney(value: string): number {
    const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '');
    const float = parseFloat(cleaned);
    if (isNaN(float)) return 0;
    return Math.round(float * 100);
}

/**
 * Sum an array of centavo amounts.
 */
export function sumMoney(amounts: number[]): number {
    return amounts.reduce((acc, v) => acc + v, 0);
}
