import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TriageBadge from '../TriageBadge';

describe('TriageBadge — labels', () => {
    it('level I renders label', () => {
        render(<TriageBadge level="I" />);
        expect(screen.getByText('I')).toBeInTheDocument();
    });

    it('level II renders label', () => {
        render(<TriageBadge level="II" />);
        expect(screen.getByText('II')).toBeInTheDocument();
    });

    it('level III renders label', () => {
        render(<TriageBadge level="III" />);
        expect(screen.getByText('III')).toBeInTheDocument();
    });

    it('level IV renders label', () => {
        render(<TriageBadge level="IV" />);
        expect(screen.getByText('IV')).toBeInTheDocument();
    });

    it('level V renders label', () => {
        render(<TriageBadge level="V" />);
        expect(screen.getByText('V')).toBeInTheDocument();
    });
});

describe('TriageBadge — aria-label', () => {
    it('level I has correct aria-label', () => {
        render(<TriageBadge level="I" />);
        expect(screen.getByLabelText('I – Resucitación')).toBeInTheDocument();
    });

    it('level II has correct aria-label', () => {
        render(<TriageBadge level="II" />);
        expect(screen.getByLabelText('II – Emergencia')).toBeInTheDocument();
    });

    it('level III has correct aria-label', () => {
        render(<TriageBadge level="III" />);
        expect(screen.getByLabelText('III – Urgente')).toBeInTheDocument();
    });

    it('level IV has correct aria-label', () => {
        render(<TriageBadge level="IV" />);
        expect(screen.getByLabelText('IV – Menos urgente')).toBeInTheDocument();
    });

    it('level V has correct aria-label', () => {
        render(<TriageBadge level="V" />);
        expect(screen.getByLabelText('V – No urgente')).toBeInTheDocument();
    });
});

describe('TriageBadge — CSS triage class applied', () => {
    it('level I applies triage-i class', () => {
        const { container } = render(<TriageBadge level="I" />);
        expect(container.firstChild).toHaveClass('triage-i');
    });

    it('level II applies triage-ii class', () => {
        const { container } = render(<TriageBadge level="II" />);
        expect(container.firstChild).toHaveClass('triage-ii');
    });

    it('level III applies triage-iii class', () => {
        const { container } = render(<TriageBadge level="III" />);
        expect(container.firstChild).toHaveClass('triage-iii');
    });

    it('level IV applies triage-iv class', () => {
        const { container } = render(<TriageBadge level="IV" />);
        expect(container.firstChild).toHaveClass('triage-iv');
    });

    it('level V applies triage-v class', () => {
        const { container } = render(<TriageBadge level="V" />);
        expect(container.firstChild).toHaveClass('triage-v');
    });
});
