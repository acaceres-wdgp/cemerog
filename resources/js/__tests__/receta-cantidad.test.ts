/**
 * Quantity to dispense of a prescription line, computed from the dose, the
 * frequency and the days when they allow it.
 */
import { describe, expect, it } from 'vitest';
import {
    computeQuantity,
    dosesPerDay,
    unitsPerDose,
} from '@/pages/consulta/lib/quantityCalc';

describe('doses per day from the frequency', () => {
    it.each([
        ['cada 8 horas', 3],
        ['Cada 12 horas', 2],
        ['c/6 h', 4],
        ['cada 6h', 4],
        ['cada 24 horas', 1],
        ['3 veces al día', 3],
        ['dos veces al dia', 2],
        ['una vez al día', 1],
        ['1 vez por día', 1],
        ['diario', 1],
        ['cada día', 1],
        ['cada noche', 1],
        ['en la mañana', null],
        ['si hay dolor', null],
        ['cada 5 horas', null],
        ['', null],
    ])('«%s» → %s', (frequency, expected) => {
        expect(dosesPerDay(frequency)).toBe(expected);
    });
});

describe('units per dose', () => {
    it.each([
        ['1 cápsula', 1],
        ['2 tabletas', 2],
        ['1/2 tableta', 0.5],
        ['½ tableta', 0.5],
        ['1.5 tabletas', 1.5],
        ['1 sobre', 1],
        ['1 ampolla', 1],
        ['una tableta', 1],
        ['5 ml', null],
        ['500 mg', null],
        ['10 gotas', null],
        ['aplicar', null],
    ])('«%s» → %s', (dose, expected) => {
        expect(unitsPerDose(dose)).toBe(expected);
    });
});

describe('quantity to dispense', () => {
    const line = (
        dose: string,
        frequency: string,
        duration_days: string,
        is_continuous = false,
    ) => ({ dose, frequency, duration_days, is_continuous });

    it('is dose × doses per day × days, rounded up', () => {
        expect(computeQuantity(line('1 cápsula', 'cada 8 horas', '7'))).toBe(
            21,
        );
        expect(computeQuantity(line('1/2 tableta', 'cada 12 horas', '5'))).toBe(
            5,
        );
        expect(computeQuantity(line('1/2 tableta', 'cada 8 horas', '5'))).toBe(
            8,
        );
    });

    it('is not computed without days, when continuous, or with ml and «si hay dolor»', () => {
        expect(
            computeQuantity(line('1 cápsula', 'cada 8 horas', '')),
        ).toBeNull();
        expect(
            computeQuantity(line('1 tableta', 'diario', '30', true)),
        ).toBeNull();
        expect(computeQuantity(line('5 ml', 'cada 8 horas', '7'))).toBeNull();
        expect(
            computeQuantity(line('1 tableta', 'si hay dolor', '3')),
        ).toBeNull();
    });
});
