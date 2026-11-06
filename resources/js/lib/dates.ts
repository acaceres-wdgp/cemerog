/**
 * Calendar dates («Y-m-d») in the clinic's local day.
 *
 * Never use `toISOString()` for a calendar date: it returns the UTC day, and
 * from 8 p. m. to midnight in the Dominican Republic (UTC−4) that is already
 * tomorrow. Likewise, `new Date('Y-m-d')` is read as UTC midnight, which is the
 * previous evening locally.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** «Y-m-d» of the given moment in the browser's local day (today by default) */
export function localDateString(date: Date = new Date()): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A «Y-m-d» date as local midnight of that day */
export function parseDateOnly(date: string): Date {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/** «Y-m-d» plus n days, without time zones */
export function addDays(date: string, n: number): string {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
