/**
 * Calendar dates must follow the clinic's local day, not UTC: from 8 p. m. to
 * midnight in the Dominican Republic (UTC−4) it is already tomorrow in UTC.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    addDays,
    formatClockTime,
    formatTimeRange,
    formatDateTime,
    formatTime,
    localDateString,
    parseDateOnly,
} from '@/lib/dates';

const NIGHT = new Date('2026-11-05T21:30:00-04:00');

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NIGHT);
});

afterEach(() => {
    vi.useRealTimers();
});

describe('date helpers', () => {
    it('runs the tests in the clinic time zone', () => {
        expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(
            'America/Santo_Domingo',
        );
        // Sanity check: in UTC it is already the next day
        expect(NIGHT.toISOString().slice(0, 10)).toBe('2026-11-06');
    });

    it('gives the local calendar day at night', () => {
        expect(localDateString()).toBe('2026-11-05');
    });

    it('adds days to a Y-m-d date without time zones', () => {
        expect(addDays('2026-11-05', 1)).toBe('2026-11-06');
        expect(addDays('2026-11-05', -1)).toBe('2026-11-04');
        expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
        expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    });

    it('parses a Y-m-d date as that local day, not the previous evening', () => {
        const d = parseDateOnly('2026-11-05');
        expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([
            2026, 10, 5,
        ]);
    });
});

describe('horas en formato de 12 horas', () => {
    it('formats a moment in Dominican Republic time, as the topbar clock does', () => {
        expect(formatTime(new Date('2026-11-10T21:05:00-04:00'))).toBe(
            '9:05 PM',
        );
        expect(formatTime(new Date('2026-11-10T00:30:00-04:00'))).toBe(
            '12:30 AM',
        );
        expect(formatTime(new Date('2026-11-10T12:00:00-04:00'))).toBe(
            '12:00 PM',
        );
        // Same instant written in UTC: still the clinic's hour
        expect(formatTime(new Date('2026-11-11T01:05:00Z'))).toBe('9:05 PM');
        expect(formatDateTime(new Date('2026-11-11T01:05:00Z'))).toBe(
            '10/11/2026 9:05 PM',
        );
    });

    it('converts a stored 24-hour time for display', () => {
        expect(formatClockTime('14:30')).toBe('2:30 PM');
        expect(formatClockTime('08:00:00')).toBe('8:00 AM');
        expect(formatClockTime('00:15')).toBe('12:15 AM');
        expect(formatClockTime('12:00')).toBe('12:00 PM');
    });

    it('shortens a range that stays in the same half of the day', () => {
        expect(formatTimeRange('10:00 AM', '10:45 AM')).toBe(
            '10:00 – 10:45 AM',
        );
        expect(formatTimeRange('11:30 AM', '1:00 PM')).toBe(
            '11:30 AM – 1:00 PM',
        );
    });
});
