import { describe, it, expect } from 'vitest';
import {
    lbToKgTimes10,
    kgTimes10ToLb,
    feetInchesToCm,
    cmToFeetInches,
    computeImcFromMetric,
} from '../units';

describe('lbToKgTimes10', () => {
    it('converts 154 lb to 699 (round of 69.85... × 10)', () => {
        expect(lbToKgTimes10(154)).toBe(699);
    });

    it('converts 0 lb to 0', () => {
        expect(lbToKgTimes10(0)).toBe(0);
    });

    it('converts 100 lb correctly', () => {
        // 100 * 0.45359237 * 10 = 453.59... → 454
        expect(lbToKgTimes10(100)).toBe(454);
    });
});

describe('kgTimes10ToLb', () => {
    it('converts 699 back to ~154.1 lb (round-trip within 0.1 lb)', () => {
        const result = kgTimes10ToLb(699);
        expect(Math.abs(result - 154.1)).toBeLessThanOrEqual(0.1);
    });

    it('round-trip: lbToKgTimes10 then kgTimes10ToLb returns original within 0.1 lb', () => {
        const original = 154;
        const stored = lbToKgTimes10(original);
        const recovered = kgTimes10ToLb(stored);
        expect(Math.abs(recovered - original)).toBeLessThanOrEqual(0.1);
    });

    it('round-trip for 200 lb', () => {
        const original = 200;
        const stored = lbToKgTimes10(original);
        const recovered = kgTimes10ToLb(stored);
        expect(Math.abs(recovered - original)).toBeLessThanOrEqual(0.1);
    });
});

describe('feetInchesToCm', () => {
    it('converts 5 ft 7 in to 170 cm (round of 170.18)', () => {
        expect(feetInchesToCm(5, 7)).toBe(170);
    });

    it('converts 6 ft 0 in to 183 cm', () => {
        // 6 * 12 = 72 inches * 2.54 = 182.88 → 183
        expect(feetInchesToCm(6, 0)).toBe(183);
    });

    it('converts 5 ft 0 in to 152 cm', () => {
        // 5 * 12 = 60 inches * 2.54 = 152.4 → 152
        expect(feetInchesToCm(5, 0)).toBe(152);
    });
});

describe('cmToFeetInches', () => {
    it('converts 170 cm to 5 ft 6 in (170/2.54 = 66.9in = 5ft 6.9in)', () => {
        const result = cmToFeetInches(170);
        expect(result.ft).toBe(5);
        expect(result.inches).toBe(6);
    });

    it('inches is always 0–11', () => {
        for (let cm = 100; cm <= 250; cm += 5) {
            const result = cmToFeetInches(cm);
            expect(result.inches).toBeGreaterThanOrEqual(0);
            expect(result.inches).toBeLessThanOrEqual(11);
        }
    });

    it('round-trip: feetInchesToCm then cmToFeetInches returns original within 1 inch', () => {
        const { ft, inches } = cmToFeetInches(feetInchesToCm(5, 7));
        expect(ft).toBe(5);
        // 170 cm = 66.9 in → 5ft 6in, which is within 1 of original 7 in
        expect(Math.abs(inches - 7)).toBeLessThanOrEqual(1);
    });
});

describe('computeImcFromMetric', () => {
    it('computes BMI ~24.1 for 154 lb and 5ft 7in stored values', () => {
        const pesoKgTimes10 = lbToKgTimes10(154); // 699
        const tallaCm = feetInchesToCm(5, 7); // 170
        // IMC = (699/10) / (1.70)^2 = 69.9 / 2.89 = 24.1...
        const result = computeImcFromMetric(pesoKgTimes10, tallaCm);
        expect(result.value).toBeCloseTo(24.1, 0);
        expect(result.category).toBe('Normal');
    });

    it('returns Bajo for IMC < 18.5', () => {
        // 50 kg, 175 cm → IMC = 50 / 3.0625 = 16.3
        const result = computeImcFromMetric(500, 175);
        expect(result.category).toBe('Bajo peso');
    });

    it('returns Sobrepeso for IMC 25–29.9', () => {
        // 80 kg, 175 cm → IMC = 80 / 3.0625 = 26.1
        const result = computeImcFromMetric(800, 175);
        expect(result.category).toBe('Sobrepeso');
    });

    it('returns Obesidad for IMC >= 30', () => {
        // 100 kg, 175 cm → IMC = 100 / 3.0625 = 32.7
        const result = computeImcFromMetric(1000, 175);
        expect(result.category).toBe('Obesidad');
    });

    it('returns null values when inputs are null or zero', () => {
        expect(computeImcFromMetric(null, 170)).toEqual({
            value: null,
            category: null,
            display: '—',
        });
        expect(computeImcFromMetric(700, null)).toEqual({
            value: null,
            category: null,
            display: '—',
        });
        expect(computeImcFromMetric(700, 0)).toEqual({
            value: null,
            category: null,
            display: '—',
        });
    });
});
