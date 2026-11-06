import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClinicHeader from '@/components/cemerog/ClinicHeader';

const clinic = {
    name: 'Clínica Dres. Rodríguez & Guzmán',
    rnc: '1-01-00000-1',
    phone: '(809) 555-0100',
    address: 'Calle de Prueba #123, Santo Domingo',
};

describe('ClinicHeader', () => {
    it('shows the full clinic information', () => {
        render(<ClinicHeader clinic={clinic} />);
        expect(
            screen.getByText('Clínica Dres. Rodríguez & Guzmán'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Dres. Rodríguez & Guzmán'),
        ).toBeInTheDocument();
        expect(screen.getByText('RNC: 1-01-00000-1')).toBeInTheDocument();
        expect(screen.getByText('Tel: (809) 555-0100')).toBeInTheDocument();
        expect(
            screen.getByText('Calle de Prueba #123, Santo Domingo'),
        ).toBeInTheDocument();
    });

    it('omits the optional fields that are empty', () => {
        render(
            <ClinicHeader
                clinic={{ name: null, rnc: null, phone: null, address: null }}
            />,
        );
        expect(screen.getByText('CEMEROG')).toBeInTheDocument();
        expect(screen.queryByText(/RNC:/)).toBeNull();
        expect(screen.queryByText(/Tel:/)).toBeNull();
    });
});
