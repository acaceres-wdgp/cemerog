import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import SearchSelect from '../SearchSelect';

const options = [
    { value: '1', label: 'Dipirona 1 g/2 ml', hint: 'MED-001' },
    { value: '2', label: 'Ceftriaxona 1 g', hint: 'MED-002' },
    { value: '3', label: 'Gasa estéril 4x4', hint: 'INS-001' },
];

function Harness({
    onChange = () => {},
    action,
}: {
    onChange?: (v: string) => void;
    action?: { label: string; onSelect: () => void };
}) {
    const [value, setValue] = useState('');

    return (
        <SearchSelect
            aria-label="Producto"
            options={options}
            value={value}
            placeholder="Elegir producto…"
            action={action}
            onChange={(v) => {
                setValue(v);
                onChange(v);
            }}
        />
    );
}

describe('SearchSelect', () => {
    it('lists every option when opened, like a select', () => {
        render(<Harness />);

        fireEvent.focus(screen.getByRole('combobox', { name: 'Producto' }));

        expect(screen.getAllByRole('option')).toHaveLength(3);
    });

    it('filters by name or code ignoring accents and case', () => {
        render(<Harness />);
        const input = screen.getByRole('combobox', { name: 'Producto' });

        fireEvent.change(input, { target: { value: 'esteril' } });
        expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(
            [expect.stringContaining('Gasa estéril 4x4')],
        );

        fireEvent.change(input, { target: { value: 'med-002' } });
        expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(
            [expect.stringContaining('Ceftriaxona')],
        );
    });

    it('selects with a click and shows the chosen label', () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        const input = screen.getByRole('combobox', { name: 'Producto' });

        fireEvent.change(input, { target: { value: 'cef' } });
        fireEvent.mouseDown(
            screen.getByRole('option', { name: /Ceftriaxona/ }),
        );

        expect(onChange).toHaveBeenCalledWith('2');
        expect(input).toHaveValue('Ceftriaxona 1 g');
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('selects with the keyboard', () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);
        const input = screen.getByRole('combobox', { name: 'Producto' });

        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onChange).toHaveBeenCalledWith('2');
    });

    it('says when nothing matches and restores the label on blur', () => {
        render(<Harness />);
        const input = screen.getByRole('combobox', { name: 'Producto' });

        fireEvent.change(input, { target: { value: 'gas' } });
        fireEvent.mouseDown(screen.getByRole('option', { name: /Gasa/ }));
        fireEvent.change(input, { target: { value: 'zzz' } });
        expect(screen.getByText('Sin resultados')).toBeTruthy();

        fireEvent.blur(input);
        expect(input).toHaveValue('Gasa estéril 4x4');
    });

    it('offers an extra action at the end of the list', () => {
        const onSelect = vi.fn();
        render(
            <Harness action={{ label: '+ Crear producto nuevo…', onSelect }} />,
        );

        fireEvent.change(screen.getByRole('combobox', { name: 'Producto' }), {
            target: { value: 'zzz' },
        });
        fireEvent.mouseDown(
            screen.getByRole('option', { name: '+ Crear producto nuevo…' }),
        );

        expect(onSelect).toHaveBeenCalled();
    });
});
