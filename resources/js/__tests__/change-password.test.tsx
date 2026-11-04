import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChangePassword from '@/pages/auth/change-password';

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
}));

describe('change password page', () => {
    it('shows placeholders on both password fields', () => {
        render(<ChangePassword />);

        expect(screen.getByLabelText(/Nueva contraseña/)).toHaveAttribute(
            'placeholder',
            'Ingresa tu nueva contraseña',
        );
        expect(screen.getByLabelText(/Confirmar contraseña/)).toHaveAttribute(
            'placeholder',
            'Repite tu nueva contraseña',
        );
    });
});
