// ─── Date helpers & slot constants ────────────────────────────────────────────

import { parseDateOnly } from '@/lib/dates';

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

export function formatDateLong(dateStr: string) {
    return parseDateOnly(dateStr).toLocaleDateString('es-DO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}
