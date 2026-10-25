/**
 * DataTable – TanStack Table wrapper with server-side pagination, row-click
 * support, and numbered pagination that matches the CEMEROG design spec.
 *
 * Pagination renders: first, active±1, last, with "…" at the gaps.
 * The paginator prop accepts a Laravel LengthAwarePaginator shape directly.
 */

import {
    flexRender,
    tableFeatures,
    useTable,
    type ColumnDef,
    type RowData,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const features = tableFeatures({});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- columns hold values of mixed types
export type DataTableColumn<TData extends RowData> = ColumnDef<
    typeof features,
    TData,
    any
>;

/** Shape of Laravel's LengthAwarePaginator as received from Inertia. */
export interface LaravelPaginator<TData> {
    data: TData[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    per_page: number;
    path: string;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface DataTableProps<TData extends RowData> {
    data: TData[];
    columns: DataTableColumn<TData>[];
    /** Laravel paginator for numbered pagination footer */
    paginator?: LaravelPaginator<TData>;
    onPageChange?: (page: number) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    /** Called when a row is clicked */
    onRowClick?: (row: TData) => void;
    /** Id of the currently selected row (for highlight) */
    selectedRowId?: number | string | null;
    /** Singular noun for the "Mostrando X–Y de Z {noun}" footer text */
    noun?: string;
}

function buildPageNumbers(current: number, last: number): (number | '...')[] {
    const pages: (number | '...')[] = [];

    const add = (n: number) => {
        if (!pages.includes(n)) pages.push(n);
    };

    add(1);
    if (current - 1 > 2) pages.push('...');
    if (current - 1 > 1) add(current - 1);
    add(current);
    if (current + 1 < last) add(current + 1);
    if (current + 1 < last - 1) pages.push('...');
    add(last);

    // Remove duplicate first/last if last === 1
    return pages.filter((p, i, arr) => p !== '...' || arr[i - 1] !== '...');
}

export default function DataTable<TData extends RowData>({
    data,
    columns,
    paginator,
    onPageChange,
    isLoading = false,
    emptyMessage = 'No se encontraron registros.',
    onRowClick,
    selectedRowId,
    noun = 'registros',
}: DataTableProps<TData>) {
    const table = useTable({ features, columns, data });

    const currentPage = paginator?.current_page ?? 1;
    const lastPage = paginator?.last_page ?? 1;
    const from = paginator?.from ?? 0;
    const to = paginator?.to ?? 0;
    const total = paginator?.total ?? 0;

    const pageNumbers = paginator
        ? buildPageNumbers(currentPage, lastPage)
        : [];

    return (
        <div className="flex flex-col">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr
                                key={headerGroup.id}
                                className="h-10 border-b border-success-border bg-table-header-bg"
                            >
                                {headerGroup.headers.map((header, idx) => (
                                    <th
                                        key={header.id}
                                        className={`py-0 text-left text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase ${idx === 0 ? 'pr-3 pl-5' : 'px-3'}`}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext(),
                                              )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="py-10 text-center text-muted"
                                >
                                    Cargando...
                                </td>
                            </tr>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="py-10 text-center text-muted"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const rowId = (row.original as any)?.id;
                                const isSelected =
                                    selectedRowId !== undefined &&
                                    selectedRowId !== null &&
                                    rowId === selectedRowId;

                                return (
                                    <tr
                                        key={row.id}
                                        role={onRowClick ? 'button' : undefined}
                                        tabIndex={onRowClick ? 0 : undefined}
                                        onClick={() =>
                                            onRowClick?.(row.original)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                onRowClick &&
                                                (e.key === 'Enter' ||
                                                    e.key === ' ')
                                            ) {
                                                e.preventDefault();
                                                onRowClick(row.original);
                                            }
                                        }}
                                        className={`border-b border-divider transition-colors last:border-0 ${
                                            isSelected
                                                ? 'bg-info-bg'
                                                : onRowClick
                                                  ? 'cursor-pointer hover:bg-table-header-bg'
                                                  : ''
                                        }`}
                                    >
                                        {row.getAllCells().map((cell, idx) => (
                                            <td
                                                key={cell.id}
                                                className={`py-3 text-text-body ${idx === 0 ? 'pr-3 pl-5' : 'px-3'}`}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination footer */}
            {paginator && onPageChange && (
                <div className="flex items-center justify-between border-t border-divider px-5 py-3 text-sm text-muted">
                    <span>
                        {total > 0
                            ? `Mostrando ${from}–${to} de ${total} ${noun}`
                            : `0 ${noun}`}
                    </span>

                    {lastPage > 1 && (
                        <div className="flex items-center gap-1">
                            {/* Previous */}
                            <button
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-white text-muted hover:bg-app-bg disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Página anterior"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            {pageNumbers.map((p, idx) =>
                                p === '...' ? (
                                    <span
                                        key={`ellipsis-${idx}`}
                                        className="flex h-8 w-8 items-center justify-center text-muted-light"
                                    >
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => onPageChange(p)}
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                                            p === currentPage
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-card-border bg-white text-muted hover:bg-app-bg'
                                        }`}
                                        aria-current={
                                            p === currentPage
                                                ? 'page'
                                                : undefined
                                        }
                                    >
                                        {p}
                                    </button>
                                ),
                            )}

                            {/* Next */}
                            <button
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === lastPage}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-white text-muted hover:bg-app-bg disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Página siguiente"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
