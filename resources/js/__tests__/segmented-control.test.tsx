import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SegmentedControl from '@/components/cemerog/SegmentedControl';

const segments = [
    { value: 'todos', label: 'Todos', count: 42 },
    { value: 'hoy', label: 'Atendidos hoy', count: 3 },
    { value: 'alergias', label: 'Con alergias' },
];

describe('SegmentedControl', () => {
    // M1 – container has correct design tokens
    it('contenedor tiene clases de diseño correctas', () => {
        const { container } = render(
            <SegmentedControl segments={segments} value="todos" onChange={() => {}} />,
        );
        const div = container.firstElementChild as HTMLElement;
        expect(div.className).toContain('bg-[#F3F7F2]');
        expect(div.className).toContain('border-[#e3e9e3]');
        expect(div.className).toContain('rounded-[11px]');
        expect(div.className).toContain('p-[3px]');
    });

    // M2 – active button has white background and shadow
    it('botón activo tiene fondo blanco y sombra', () => {
        render(<SegmentedControl segments={segments} value="todos" onChange={() => {}} />);
        const activeBtn = screen.getByRole('tab', { name: /Todos/ });
        expect(activeBtn.className).toContain('bg-white');
        expect(activeBtn.className).toContain('shadow');
    });

    it('botón inactivo tiene fondo transparente', () => {
        render(<SegmentedControl segments={segments} value="todos" onChange={() => {}} />);
        const inactiveBtn = screen.getByRole('tab', { name: /Atendidos hoy/ });
        expect(inactiveBtn.className).toContain('bg-transparent');
        expect(inactiveBtn.className).not.toContain('bg-white');
    });

    // M3 – counter is plain text, not a badge/pill with background
    it('contador se renderiza como texto plano sin fondo de badge', () => {
        render(<SegmentedControl segments={segments} value="todos" onChange={() => {}} />);
        const counter = screen.getByLabelText('42');
        // Should NOT have a rounded-full bg class like the old implementation
        expect(counter.className).not.toContain('rounded-full');
        expect(counter.className).not.toContain('bg-[#EEF6E2]');
        expect(counter.className).not.toContain('bg-[#e4e4e7]');
        expect(counter.textContent).toBe('42');
    });

    it('segmento sin contador no muestra span de contador', () => {
        render(<SegmentedControl segments={segments} value="todos" onChange={() => {}} />);
        const alergiaBtn = screen.getByRole('tab', { name: 'Con alergias' });
        // No counter span should be inside this button
        expect(alergiaBtn.querySelectorAll('[aria-label]')).toHaveLength(0);
    });

    // M4 – clicking a segment calls onChange
    it('clic en segmento llama a onChange con el valor correcto', () => {
        const onChange = vi.fn();
        render(<SegmentedControl segments={segments} value="todos" onChange={onChange} />);
        fireEvent.click(screen.getByRole('tab', { name: /Atendidos hoy/ }));
        expect(onChange).toHaveBeenCalledWith('hoy');
    });

    it('los botones tienen altura de 30px (h-[30px])', () => {
        render(<SegmentedControl segments={segments} value="todos" onChange={() => {}} />);
        const btn = screen.getByRole('tab', { name: /Todos/ });
        expect(btn.className).toContain('h-[30px]');
    });
});
