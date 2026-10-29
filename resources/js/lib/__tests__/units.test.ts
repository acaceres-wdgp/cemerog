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
    it('converts 699 back to 154 lb (rounded to nearest half-pound)', () => {
        // 699/10/0.45359237 = 154.101... → rounded to nearest 0.5 → 154
        expect(kgTimes10ToLb(699)).toBe(154);
    });

    it('exhaustive round-trip: every weight 2–700 lb in 0.5 lb steps displays exact original', () => {
        for (let lb = 2; lb <= 700; lb += 0.5) {
            const stored = lbToKgTimes10(lb);
            const displayed = kgTimes10ToLb(stored);
            expect(displayed).toBe(lb);
        }
    });

    it('round-trip for 200 lb', () => {
        const stored = lbToKgTimes10(200);
        expect(kgTimes10ToLb(stored)).toBe(200);
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
    it('converts 170 cm to 5 ft 7 in (Math.round(170/2.54)=67in=5ft7in)', () => {
        const result = cmToFeetInches(170);
        expect(result.ft).toBe(5);
        expect(result.inches).toBe(7);
    });

    it('inches is always 0–11', () => {
        for (let cm = 30; cm <= 241; cm += 1) {
            const result = cmToFeetInches(cm);
            expect(result.inches).toBeGreaterThanOrEqual(0);
            expect(result.inches).toBeLessThanOrEqual(11);
        }
    });

    it('exhaustive round-trip: feetInchesToCm then cmToFeetInches returns exact same ft and inches (1\'0" to 7\'11")', () => {
        for (let ft = 1; ft <= 7; ft++) {
            const maxInches = ft === 7 ? 11 : 11;
            for (let inches = 0; inches <= maxInches; inches++) {
                const cm = feetInchesToCm(ft, inches);
                const result = cmToFeetInches(cm);
                expect(result.ft).toBe(ft);
                expect(result.inches).toBe(inches);
            }
        }
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
