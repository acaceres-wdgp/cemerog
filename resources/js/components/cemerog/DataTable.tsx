/**
 * DataTable – TanStack Table wrapper with server-side pagination support.
 */

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    PaginationState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, unknown>[];
    pagination?: PaginationState;
    pageCount?: number;
    onPaginationChange?: (pagination: PaginationState) => void;
    isLoading?: boolean;
    emptyMessage?: string;
}

export default function DataTable<TData>({
    data,
    columns,
    pagination,
    pageCount,
    onPaginationChange,
    isLoading = false,
    emptyMessage = 'No se encontraron registros.',
}: DataTableProps<TData>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: pageCount ?? -1,
        state: { pagination },
        onPaginationChange: (updater) => {
            if (onPaginationChange && pagination) {
                const next = typeof updater === 'function' ? updater(pagination) : updater;
                onPaginationChange(next);
            }
        },
    });

    return (
        <div className="flex flex-col gap-3">
            <div className="overflow-x-auto rounded-lg border border-[#e3e9e3]">
                <table className="w-full text-sm">
                    <thead className="bg-[#F6FAF1]">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-[#e3e9e3]">
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-[#56693f]"
                                        style={{ fontSize: '11.5px' }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="py-10 text-center text-[#71717a]">
                                    Cargando...
                                </td>
                            </tr>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-10 text-center text-[#71717a]">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-[#e3e9e3] hover:bg-[#F3F7F2] transition-colors last:border-0"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-4 py-3 text-[#333333]">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && onPaginationChange && pageCount !== undefined && (
                <div className="flex items-center justify-between text-sm text-[#71717a]">
                    <span>
                        Página {pagination.pageIndex + 1} de {pageCount}
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex - 1 })}
                            disabled={pagination.pageIndex === 0}
                            className="inline-flex items-center rounded border border-[#e4e4e7] bg-white px-2 py-1.5 hover:bg-[#F3F7F2] disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Página anterior"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex + 1 })}
                            disabled={pagination.pageIndex >= pageCount - 1}
                            className="inline-flex items-center rounded border border-[#e4e4e7] bg-white px-2 py-1.5 hover:bg-[#F3F7F2] disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Página siguiente"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
