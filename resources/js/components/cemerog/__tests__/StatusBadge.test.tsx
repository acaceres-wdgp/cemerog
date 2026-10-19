import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
    it('renders espera state', () => {
        render(<StatusBadge state="espera" />);
        expect(screen.getByText('En espera')).toBeInTheDocument();
    });

    it('renders consulta state', () => {
        render(<StatusBadge state="consulta" />);
        expect(screen.getByText('Consulta')).toBeInTheDocument();
    });

    it('renders emergencia state', () => {
        render(<StatusBadge state="emergencia" />);
        expect(screen.getByText('Emergencia')).toBeInTheDocument();
    });

    it('renders custom label when provided', () => {
        render(<StatusBadge state="espera" label="Custom Label" />);
        expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('renders all 9 states without error', () => {
        const states = [
            'espera', 'consulta', 'emergencia', 'internado',
            'cirugia', 'pendiente', 'balance', 'saldada', 'cancelada',
        ] as const;

        states.forEach((state) => {
            const { unmount } = render(<StatusBadge state={state} />);
            unmount();
        });
    });
});
