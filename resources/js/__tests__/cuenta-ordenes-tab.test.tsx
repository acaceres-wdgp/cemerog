import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CuentaOrdenesTab from '@/pages/consulta/components/CuentaOrdenesTab';
import type { AccountCharge } from '@/pages/consulta/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeCharge = (overrides: Partial<AccountCharge> = {}): AccountCharge => ({
    id: 1,
    type: 'consulta',
    description: 'Consulta – Dr. Rodríguez',
    quantity: 1,
    unit_price: 200000,
    total: 200000,
    doctor_fee: 30000,
    doctor_id: 1,
    doctor_name: 'Dr. Rodríguez',
    ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CuentaOrdenesTab', () => {
    it('shows empty state when there are no charges', () => {
        render(<CuentaOrdenesTab charges={[]} chargesTotal={0} />);
        expect(
            screen.getByText('No hay cargos registrados.'),
        ).toBeInTheDocument();
    });

    it('shows empty state for orders panel regardless of charges', () => {
        render(<CuentaOrdenesTab charges={[]} chargesTotal={0} />);
        expect(
            screen.getByText('No hay órdenes para esta consulta.'),
        ).toBeInTheDocument();
    });

    it('renders a charge row with description and formatted amount', () => {
        const charge = makeCharge();
        render(
            <CuentaOrdenesTab charges={[charge]} chargesTotal={charge.total} />,
        );

        expect(
            screen.getByText('Consulta – Dr. Rodríguez'),
        ).toBeInTheDocument();
        // formatMoney(200000) → RD$2,000.00
        expect(screen.getAllByText(/2,000\.00/).length).toBeGreaterThan(0);
    });

    it('renders multiple charge rows', () => {
        const charges = [
            makeCharge({ id: 1, description: 'Consulta – Dr. A', total: 200000 }),
            makeCharge({
                id: 2,
                description: 'Consulta – Dra. B',
                total: 300000,
            }),
        ];

        render(
            <CuentaOrdenesTab charges={charges} chargesTotal={500000} />,
        );

        expect(screen.getByText('Consulta – Dr. A')).toBeInTheDocument();
        expect(screen.getByText('Consulta – Dra. B')).toBeInTheDocument();
    });

    it('shows the total accumulated using formatMoney', () => {
        const charges = [
            makeCharge({ id: 1, total: 200000 }),
            makeCharge({ id: 2, total: 300000 }),
        ];

        render(<CuentaOrdenesTab charges={charges} chargesTotal={500000} />);

        expect(screen.getByText('Total acumulado')).toBeInTheDocument();
        // formatMoney(500000) → RD$5,000.00
        expect(screen.getByText(/5,000\.00/)).toBeInTheDocument();
    });
});
