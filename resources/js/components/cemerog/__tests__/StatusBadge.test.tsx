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

    it('renders all 9 original states without error', () => {
        const states = [
            'espera',
            'consulta',
            'emergencia',
            'internado',
            'cirugia',
            'pendiente',
            'balance',
            'saldada',
            'cancelada',
        ] as const;

        states.forEach((state) => {
            const { unmount } = render(<StatusBadge state={state} />);
            unmount();
        });
    });

    it('renders cita-pendiente state', () => {
        render(<StatusBadge state="cita-pendiente" />);
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('renders cita-confirmada state', () => {
        render(<StatusBadge state="cita-confirmada" />);
        expect(screen.getByText('Confirmada')).toBeInTheDocument();
    });

    it('renders cita-en_lista state', () => {
        render(<StatusBadge state="cita-en_lista" />);
        expect(screen.getByText('En lista')).toBeInTheDocument();
    });

    it('renders cita-atendida state', () => {
        render(<StatusBadge state="cita-atendida" />);
        expect(screen.getByText('Atendida')).toBeInTheDocument();
    });

    it('renders cita-no_asistio state', () => {
        render(<StatusBadge state="cita-no_asistio" />);
        expect(screen.getByText('No asistió')).toBeInTheDocument();
    });

    it('renders cita-cancelada state', () => {
        render(<StatusBadge state="cita-cancelada" />);
        expect(screen.getByText('Cancelada')).toBeInTheDocument();
    });

    it('renders cita-* states as a span with correct structure', () => {
        const { container } = render(<StatusBadge state="cita-atendida" />);
        const span = container.querySelector('span');
        expect(span).not.toBeNull();
        expect(span?.tagName).toBe('SPAN');
        expect(span?.className).toContain('inline-flex');
        expect(span?.className).toContain('rounded-full');
    });

    it('renders cita-en_lista with custom label override', () => {
        render(<StatusBadge state="cita-en_lista" label="T-01 · En lista" />);
        expect(screen.getByText('T-01 · En lista')).toBeInTheDocument();
    });
});

describe('StatusBadge — attention states apply semantic CSS class', () => {
    const attentionStates = [
        'espera',
        'consulta',
        'emergencia',
        'internado',
        'cirugia',
        'pendiente',
        'balance',
        'saldada',
        'cancelada',
    ] as const;

    it.each(attentionStates)(
        '%s applies the state-%s CSS class',
        (state) => {
            const { container } = render(<StatusBadge state={state} />);
            expect(container.firstChild).toHaveClass(`state-${state}`);
        },
    );

    it('cita-pendiente reuses espera color class', () => {
        const { container } = render(<StatusBadge state="cita-pendiente" />);
        expect(container.firstChild).toHaveClass('state-espera');
    });

    it('cita-en_lista reuses consulta color class', () => {
        const { container } = render(<StatusBadge state="cita-en_lista" />);
        expect(container.firstChild).toHaveClass('state-consulta');
    });

    it('cita-no_asistio reuses cancelada color class', () => {
        const { container } = render(<StatusBadge state="cita-no_asistio" />);
        expect(container.firstChild).toHaveClass('state-cancelada');
    });

    it('cita-cancelada reuses cancelada color class', () => {
        const { container } = render(<StatusBadge state="cita-cancelada" />);
        expect(container.firstChild).toHaveClass('state-cancelada');
    });

    it('cita-atendida applies state-cita-atendida class', () => {
        const { container } = render(<StatusBadge state="cita-atendida" />);
        expect(container.firstChild).toHaveClass('state-cita-atendida');
    });

    it('cita-confirmada applies state-cita-confirmada class', () => {
        const { container } = render(<StatusBadge state="cita-confirmada" />);
        expect(container.firstChild).toHaveClass('state-cita-confirmada');
    });
});

describe('StatusBadge — cita-* states have no border', () => {
    const citaStates = [
        'cita-pendiente',
        'cita-confirmada',
        'cita-en_lista',
        'cita-atendida',
        'cita-no_asistio',
        'cita-cancelada',
    ] as const;

    it.each(citaStates)('%s does not have the border class', (state) => {
        const { container } = render(<StatusBadge state={state} />);
        const span = container.firstChild as HTMLElement;
        const classes = span.className.split(' ');
        expect(classes).not.toContain('border');
    });

    it.each(citaStates)('%s renders without errors', (state) => {
        const { container } = render(<StatusBadge state={state} />);
        expect(container.firstChild).not.toBeNull();
    });
});
