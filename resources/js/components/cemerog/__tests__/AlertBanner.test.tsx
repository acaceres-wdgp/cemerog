import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlertBanner from '../AlertBanner';

describe('AlertBanner — renders children and title', () => {
    it('renders children text', () => {
        render(<AlertBanner variant="danger">Something went wrong</AlertBanner>);
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
        render(
            <AlertBanner variant="warning" title="Atención">
                Revisa los datos.
            </AlertBanner>,
        );
        expect(screen.getByText('Atención')).toBeInTheDocument();
        expect(screen.getByText('Revisa los datos.')).toBeInTheDocument();
    });

    it('has role="alert"', () => {
        render(<AlertBanner variant="info">Info message</AlertBanner>);
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });
});

describe('AlertBanner — CSS variant class applied', () => {
    it('danger applies alert-danger class', () => {
        const { container } = render(
            <AlertBanner variant="danger">Error</AlertBanner>,
        );
        expect(container.firstChild).toHaveClass('alert-danger');
    });

    it('warning applies alert-warning class', () => {
        const { container } = render(
            <AlertBanner variant="warning">Warning</AlertBanner>,
        );
        expect(container.firstChild).toHaveClass('alert-warning');
    });

    it('info applies alert-info class', () => {
        const { container } = render(
            <AlertBanner variant="info">Info</AlertBanner>,
        );
        expect(container.firstChild).toHaveClass('alert-info');
    });
});
