import { describe, it, expect } from 'vitest';
import { formatMoney, parseMoney, sumMoney } from '../money';

describe('formatMoney', () => {
    it('formats 150050 centavos correctly', () => {
        expect(formatMoney(150050)).toContain('1,500.50');
    });

    it('formats zero correctly', () => {
        expect(formatMoney(0)).toContain('0.00');
    });

    it('formats negative values correctly', () => {
        const result = formatMoney(-5000);
        expect(result).toContain('50.00');
    });

    it('includes DOP currency symbol', () => {
        const result = formatMoney(10000);
        // DOP symbol may be RD$ or DOP depending on locale
        expect(result).toMatch(/RD\$|DOP|\$/);
    });
});

describe('parseMoney', () => {
    it('parses formatted currency to centavos', () => {
        expect(parseMoney('1500.50')).toBe(150050);
    });

    it('handles plain number string', () => {
        expect(parseMoney('100')).toBe(10000);
    });

    it('returns 0 for invalid input', () => {
        expect(parseMoney('abc')).toBe(0);
    });
});

describe('sumMoney', () => {
    it('sums array of centavo amounts', () => {
        expect(sumMoney([100, 200, 300])).toBe(600);
    });

    it('returns 0 for empty array', () => {
        expect(sumMoney([])).toBe(0);
    });

    it('handles negative values', () => {
        expect(sumMoney([1000, -500])).toBe(500);
    });
});
