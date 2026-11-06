import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PasswordInput from '@/components/cemerog/PasswordInput';

describe('PasswordInput', () => {
    it('is as tall as the other inputs (h-9), not padding-driven', () => {
        render(<PasswordInput aria-label="Contraseña" />);
        const input = screen.getByLabelText('Contraseña');
        expect(input).toHaveClass('h-9');
        expect(input).not.toHaveClass('py-2');
    });

    it('renders the shared ui/input, so it looks identical to other inputs', () => {
        render(<PasswordInput aria-label="Contraseña" />);
        const input = screen.getByLabelText('Contraseña');
        expect(input).toHaveAttribute('data-slot', 'input');
        expect(input).toHaveClass('shadow-xs', 'border-input');
    });

    it('marks the error state', () => {
        render(<PasswordInput aria-label="Contraseña" error="Requerida" />);
        const input = screen.getByLabelText('Contraseña');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveClass('border-error-border', 'bg-error-bg');
    });

    it('still toggles the password visibility', () => {
        render(<PasswordInput aria-label="Contraseña" />);
        const input = screen.getByLabelText('Contraseña');
        expect(input).toHaveAttribute('type', 'password');

        fireEvent.click(
            screen.getByRole('button', { name: 'Mostrar contraseña' }),
        );
        expect(input).toHaveAttribute('type', 'text');
    });
});
