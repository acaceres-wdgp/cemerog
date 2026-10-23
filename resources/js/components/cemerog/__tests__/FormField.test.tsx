import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormField from '../FormField';

describe('FormField', () => {
    it('renders a labelled input with HTML attributes', () => {
        render(
            <FormField
                label="Cédula"
                name="cedula"
                placeholder="000-0000000-0"
                required
            />,
        );

        const input = screen.getByLabelText(/Cédula/);
        expect(input.tagName).toBe('INPUT');
        expect(input).toHaveAttribute('name', 'cedula');
        expect(input).toHaveAttribute('placeholder', '000-0000000-0');
    });

    it('shows the error instead of the help text', () => {
        render(
            <FormField
                label="Cédula"
                name="cedula"
                error="Cédula inválida."
                help="Con guiones"
            />,
        );

        expect(screen.getByRole('alert')).toHaveTextContent('Cédula inválida.');
        expect(screen.queryByText('Con guiones')).not.toBeInTheDocument();
    });

    it('renders a textarea and a select', () => {
        render(
            <>
                <FormField label="Notas" name="notes" as="textarea" rows={3} />
                <FormField label="Especialidad" name="especialidad" as="select">
                    <option value="cardio">Cardiología</option>
                </FormField>
            </>,
        );

        expect(screen.getByLabelText('Notas').tagName).toBe('TEXTAREA');
        expect(screen.getByLabelText('Especialidad')).toHaveValue('cardio');
    });
});
