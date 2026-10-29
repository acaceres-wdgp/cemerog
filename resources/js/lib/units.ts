// ─── Unit conversion utilities ────────────────────────────────────────────────
// Storage format: peso in kg × 10 (integer), talla in cm (integer)
// Display format (Dominican Republic): weight in lb, height in ft + inches

const LB_TO_KG = 0.45359237;
const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

/** Convert pounds to the storage format (kg × 10), rounded to nearest integer. */
export function lbToKgTimes10(lb: number): number {
    return Math.round(lb * LB_TO_KG * 10);
}

/**
 * Convert from storage format (kg × 10) back to pounds, rounded to the
 * nearest half pound (0.5 lb).  The max storage error is ~0.11 lb which is
 * less than 0.25, so any integer or .5 weight entered by the user comes back
 * exactly as entered (e.g. 699 → 154 lb, not 154.1 lb).
 */
export function kgTimes10ToLb(v: number): number {
    const kg = v / 10;
    const lb = kg / LB_TO_KG;
    return Math.round(lb * 2) / 2;
}

/** Convert feet + inches to cm (storage format), rounded to nearest integer. */
export function feetInchesToCm(ft: number, inches: number): number {
    const totalInches = ft * INCHES_PER_FOOT + inches;
    return Math.round(totalInches * CM_PER_INCH);
}

/**
 * Convert cm (storage format) to feet + inches for display.
 * Uses Math.round so that the stored cm value round-trips back to the
 * original ft+in that was entered (e.g. 170 cm → 5′7″, not 5′6″).
 * Guaranteed: 0 ≤ inches ≤ 11.
 */
export function cmToFeetInches(cm: number): { ft: number; inches: number } {
    const totalInches = Math.round(cm / CM_PER_INCH);
    const ft = Math.floor(totalInches / INCHES_PER_FOOT);
    const inches = totalInches % INCHES_PER_FOOT;
    return { ft, inches };
}

export type ImcResult = {
    value: number | null;
    category: string | null;
    display: string;
};

/**
 * Compute BMI from metric storage values.
 * @param pesoKgTimes10 - weight stored as kg × 10 (integer)
 * @param tallaCm - height stored in cm (integer)
 */
export function computeImcFromMetric(
    pesoKgTimes10: number | null,
    tallaCm: number | null,
): ImcResult {
    if (!pesoKgTimes10 || !tallaCm || tallaCm === 0) {
        return { value: null, category: null, display: '—' };
    }
    const kg = pesoKgTimes10 / 10;
    const m = tallaCm / 100;
    const imc = kg / (m * m);
    const category =
        imc < 18.5
            ? 'Bajo peso'
            : imc < 25
              ? 'Normal'
              : imc < 30
                ? 'Sobrepeso'
                : 'Obesidad';
    return {
        value: imc,
        category,
        display: `${imc.toFixed(1)} ${category}`,
    };
}

/** Format a stored peso (kg × 10) as pounds for display. */
export function formatPesoLb(pesoKgTimes10: number | null): string {
    if (pesoKgTimes10 === null || pesoKgTimes10 === 0) return '—';
    return `${kgTimes10ToLb(pesoKgTimes10)} lb`;
}

/** Format a stored talla (cm) as ft′in″ for display. */
export function formatTallaFtIn(tallaCm: number | null): string {
    if (tallaCm === null || tallaCm === 0) return '—';
    const { ft, inches } = cmToFeetInches(tallaCm);
    return `${ft}′${inches}″`;
}
