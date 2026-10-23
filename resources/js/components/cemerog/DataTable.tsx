/**
 * DataTable – TanStack Table wrapper with server-side pagination support.
 * Pagination is controlled by the parent; the table only renders the rows it receives.
 */

import {
    flexRender,
    tableFeatures,
    useTable,
    type ColumnDef,
    type PaginationState,
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

interface DataTableProps<TData extends RowData> {
    data: TData[];
    columns: DataTableColumn<TData>[];
    pagination?: PaginationState;
    pageCount?: number;
    onPaginationChange?: (pagination: PaginationState) => void;
    isLoading?: boolean;
    emptyMessage?: string;
}

export default function DataTable<TData extends RowData>({
    data,
    columns,
    pagination,
    pageCount,
    onPaginationChange,
    isLoading = false,
    emptyMessage = 'No se encontraron registros.',
}: DataTableProps<TData>) {
    const table = useTable({ features, columns, data });

    return (
        <div className="flex flex-col gap-3">
            <div className="overflow-x-auto rounded-lg border border-[#e3e9e3]">
                <table className="w-full text-sm">
                    <thead className="bg-[#F6FAF1]">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr
                                key={headerGroup.id}
                                className="border-b border-[#e3e9e3]"
                            >
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left font-semibold tracking-wide text-[#56693f] uppercase"
                                        style={{ fontSize: '11.5px' }}
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
                                    className="py-10 text-center text-[#71717a]"
                                >
                                    Cargando...
                                </td>
                            </tr>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="py-10 text-center text-[#71717a]"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-[#e3e9e3] transition-colors last:border-0 hover:bg-[#F3F7F2]"
                                >
                                    {row.getAllCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-4 py-3 text-[#333333]"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
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
                            onClick={() =>
                                onPaginationChange({
                                    ...pagination,
                                    pageIndex: pagination.pageIndex - 1,
                                })
                            }
                            disabled={pagination.pageIndex === 0}
                            className="inline-flex items-center rounded border border-[#e4e4e7] bg-white px-2 py-1.5 hover:bg-[#F3F7F2] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Página anterior"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() =>
                                onPaginationChange({
                                    ...pagination,
                                    pageIndex: pagination.pageIndex + 1,
                                })
                            }
                            disabled={pagination.pageIndex >= pageCount - 1}
                            className="inline-flex items-center rounded border border-[#e4e4e7] bg-white px-2 py-1.5 hover:bg-[#F3F7F2] disabled:cursor-not-allowed disabled:opacity-40"
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
