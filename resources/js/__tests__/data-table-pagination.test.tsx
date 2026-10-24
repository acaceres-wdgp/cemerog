import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import DataTable, {
    type LaravelPaginator,
} from '@/components/cemerog/DataTable';
import { type ColumnDef } from '@tanstack/react-table';

interface Row {
    id: number;
    name: string;
}

const columns = [
    { id: 'name', header: 'Nombre', accessorKey: 'name' },
] as ColumnDef<any, Row, any>[];

function makePaginator(
    current: number,
    last: number,
    total = 42,
    perPage = 15,
): LaravelPaginator<Row> {
    const from = (current - 1) * perPage + 1;
    const to = Math.min(current * perPage, total);
    return {
        data: [{ id: 1, name: 'Ana' }],
        current_page: current,
        last_page: last,
        from,
        to,
        total,
        per_page: perPage,
        path: '/pacientes',
        links: [],
    };
}

describe('DataTable pagination', () => {
    // N1 – "Mostrando X–Y de Z pacientes"
    it('muestra "Mostrando 1–15 de 42 pacientes"', () => {
        render(
            <DataTable
                data={[{ id: 1, name: 'Ana' }]}
                columns={columns}
                paginator={makePaginator(1, 3)}
                onPageChange={() => {}}
                noun="pacientes"
            />,
        );
        expect(screen.getByText(/Mostrando 1–15 de 42 pacientes/)).toBeTruthy();
    });

    // N2 – prev button disabled on first page
    it('botón anterior deshabilitado en la primera página', () => {
        render(
            <DataTable
                data={[{ id: 1, name: 'Ana' }]}
                columns={columns}
                paginator={makePaginator(1, 3)}
                onPageChange={() => {}}
            />,
        );
        const prev = screen.getByLabelText('Página anterior');
        expect((prev as HTMLButtonElement).disabled).toBe(true);
    });

    // N3 – next button disabled on last page
    it('botón siguiente deshabilitado en la última página', () => {
        render(
            <DataTable
                data={[{ id: 1, name: 'Ana' }]}
                columns={columns}
                paginator={makePaginator(3, 3)}
                onPageChange={() => {}}
            />,
        );
        const next = screen.getByLabelText('Página siguiente');
        expect((next as HTMLButtonElement).disabled).toBe(true);
    });

    // N4 – active page button has green bg
    it('botón de página activa tiene bg-[#2E8B3E] y texto blanco', () => {
        render(
            <DataTable
                data={[{ id: 1, name: 'Ana' }]}
                columns={columns}
                paginator={makePaginator(2, 5)}
                onPageChange={() => {}}
            />,
        );
        const activeBtn = screen.getByRole('button', { name: '2' });
        expect(activeBtn.className).toContain('bg-[#2E8B3E]');
        expect(activeBtn.className).toContain('text-white');
    });

    // N5 – ellipsis between page 1 and current-1 when current >= 3
    it('muestra "…" entre la página 1 y la actual-1 cuando current >= 3', () => {
        const { container } = render(
            <DataTable
                data={[{ id: 1, name: 'Ana' }]}
                columns={columns}
                paginator={makePaginator(5, 10, 150)}
                onPageChange={() => {}}
            />,
        );
        const ellipses = container.querySelectorAll('span');
        const hasEllipsis = Array.from(ellipses).some(
            (el) => el.textContent === '…',
        );
        expect(hasEllipsis).toBe(true);
    });

    // N6 – ellipsis between current+1 and last when current <= last-2
    it('muestra "…" entre current+1 y último cuando current <= last-2', () => {
        const { container } = render(
            <DataTable
                data={[{ id: 1, name: 'Ana' }]}
                columns={columns}
                paginator={makePaginator(2, 10, 150)}
                onPageChange={() => {}}
            />,
        );
        const ellipses = container.querySelectorAll('span');
        const hasEllipsis = Array.from(ellipses).some(
            (el) => el.textContent === '…',
        );
        expect(hasEllipsis).toBe(true);
    });

    // Row click
    it('clic en fila llama a onRowClick con los datos de la fila', () => {
        const onRowClick = vi.fn();
        const row = { id: 42, name: 'Pedro' };
        render(
            <DataTable
                data={[row]}
                columns={columns}
                onRowClick={onRowClick}
            />,
        );
        const tr = screen.getByRole('button');
        fireEvent.click(tr);
        expect(onRowClick).toHaveBeenCalledWith(row);
    });

    // Keyboard – Enter
    it('Enter sobre una fila dispara onRowClick', () => {
        const onRowClick = vi.fn();
        const row = { id: 7, name: 'Ana' };
        render(
            <DataTable
                data={[row]}
                columns={columns}
                onRowClick={onRowClick}
            />,
        );
        const tr = screen.getByRole('button');
        fireEvent.keyDown(tr, { key: 'Enter' });
        expect(onRowClick).toHaveBeenCalledWith(row);
    });

    // Keyboard – Space
    it('Espacio sobre una fila dispara onRowClick', () => {
        const onRowClick = vi.fn();
        const row = { id: 7, name: 'Ana' };
        render(
            <DataTable
                data={[row]}
                columns={columns}
                onRowClick={onRowClick}
            />,
        );
        const tr = screen.getByRole('button');
        fireEvent.keyDown(tr, { key: ' ' });
        expect(onRowClick).toHaveBeenCalledWith(row);
    });

    // Selected row highlight
    it('fila seleccionada tiene fondo #F3F9EC', () => {
        render(
            <DataTable
                data={[{ id: 42, name: 'Seleccionado' }]}
                columns={columns}
                onRowClick={() => {}}
                selectedRowId={42}
            />,
        );
        const tr = screen.getByRole('button');
        expect(tr.className).toContain('bg-[#F3F9EC]');
    });
});
