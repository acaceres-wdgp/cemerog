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

/**
 * Times as the clinic reads them: Dominican Republic time on a 12-hour clock,
 * «9:05 PM», whatever time zone the device has. Same as ClinicTime in PHP.
 * Values for time inputs or grids stay in 24 hours: these are for display.
 */
export const CLINIC_TIMEZONE = 'America/Santo_Domingo';

const timeFormat = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: CLINIC_TIMEZONE,
});

const dateFormat = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: CLINIC_TIMEZONE,
});

/** «9:05 PM» */
export function formatTime(date: Date): string {
    // Some browsers put a narrow no-break space before AM/PM
    return timeFormat.format(date).replace(/\u202f/g, ' ');
}

/** «10/11/2026 9:05 PM» */
export function formatDateTime(date: Date): string {
    return `${dateFormat.format(date)} ${formatTime(date)}`;
}

/** A stored 24-hour time («14:30» or «14:30:00») as «2:30 PM» */
export function formatClockTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** «10:00 – 10:45 AM»: the AM/PM once when both times share it, to fit small spaces */
export function formatTimeRange(start: string, end: string): string {
    const period = (t: string) => t.slice(-2);
    return period(start) === period(end)
        ? `${start.slice(0, -3)} – ${end}`
        : `${start} – ${end}`;
}
