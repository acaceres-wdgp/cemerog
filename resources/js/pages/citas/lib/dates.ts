// ─── Date helpers & slot constants ────────────────────────────────────────────

export const SLOTS = [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '14:00',
    '14:30',
    '15:00',
];

export function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

export function tomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, n: number) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}

export function formatDateLong(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-DO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}
