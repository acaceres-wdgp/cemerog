import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import DataTable, { type DataTableColumn } from '../DataTable';

type Paciente = { nombre: string; cedula: string };

const columns: DataTableColumn<Paciente>[] = [
    { accessorKey: 'nombre', header: 'Nombre' },
    {
        accessorKey: 'cedula',
        header: 'Cédula',
        cell: (info) => <strong>{String(info.getValue())}</strong>,
    },
];

const data: Paciente[] = [
    { nombre: 'María García', cedula: '001-0000001-1' },
    { nombre: 'Juan Pérez', cedula: '001-0000002-2' },
];

describe('DataTable', () => {
    it('renders headers and rows', () => {
        render(<DataTable data={data} columns={columns} />);

        expect(
            screen.getByRole('columnheader', { name: 'Nombre' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('columnheader', { name: 'Cédula' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('cell', { name: 'María García' }),
        ).toBeInTheDocument();
        expect(screen.getByText('001-0000002-2').tagName).toBe('STRONG');
    });

    it('shows the empty message without rows', () => {
        render(
            <DataTable
                data={[]}
                columns={columns}
                emptyMessage="Sin pacientes."
            />,
        );

        expect(screen.getByText('Sin pacientes.')).toBeInTheDocument();
    });

    it('shows a loading state', () => {
        render(<DataTable data={data} columns={columns} isLoading />);

        expect(screen.getByText('Cargando...')).toBeInTheDocument();
        expect(screen.queryByText('María García')).not.toBeInTheDocument();
    });

    it('asks for the next and previous page', () => {
        const onPageChange = vi.fn();
        render(
            <DataTable
                data={data}
                columns={columns}
                paginator={{
                    data,
                    current_page: 2,
                    last_page: 3,
                    from: 3,
                    to: 4,
                    total: 6,
                    per_page: 2,
                    path: '/test',
                    links: [],
                }}
                onPageChange={onPageChange}
            />,
        );

        fireEvent.click(screen.getByLabelText('Página siguiente'));
        expect(onPageChange).toHaveBeenLastCalledWith(3);

        fireEvent.click(screen.getByLabelText('Página anterior'));
        expect(onPageChange).toHaveBeenLastCalledWith(1);
    });
});
