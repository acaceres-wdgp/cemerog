/**
 * ClinicalHistoryList – expandable clinical history entries with filters.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistoryEntry {
    id: number | string;
    date: string; // ISO date string
    type: string;
    provider?: string;
    summary: string;
    details?: string;
}

interface ClinicalHistoryListProps {
    entries: HistoryEntry[];
    filterTypes?: string[];
    className?: string;
}

export default function ClinicalHistoryList({
    entries,
    filterTypes,
    className = '',
}: ClinicalHistoryListProps) {
    const [expanded, setExpanded] = useState<Set<string | number>>(new Set());
    const [activeFilter, setActiveFilter] = useState<string>('all');

    const types = filterTypes ?? [...new Set(entries.map((e) => e.type))];

    const filtered =
        activeFilter === 'all'
            ? entries
            : entries.filter((e) => e.type === activeFilter);

    const toggle = (id: string | number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {types.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`rounded-full border px-3 py-0.5 text-xs font-medium transition-colors ${
                            activeFilter === 'all'
                                ? 'border-[#2E8B3E] bg-[#EEF6E2] text-[#2f4a17]'
                                : 'border-[#e4e4e7] text-[#71717a] hover:border-[#2E8B3E]'
                        }`}
                    >
                        Todos
                    </button>
                    {types.map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveFilter(type)}
                            className={`rounded-full border px-3 py-0.5 text-xs font-medium transition-colors ${
                                activeFilter === type
                                    ? 'border-[#2E8B3E] bg-[#EEF6E2] text-[#2f4a17]'
                                    : 'border-[#e4e4e7] text-[#71717a] hover:border-[#2E8B3E]'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-2">
                {filtered.length === 0 ? (
                    <p className="py-6 text-center text-sm text-[#71717a]">
                        No hay registros.
                    </p>
                ) : (
                    filtered.map((entry) => {
                        const isOpen = expanded.has(entry.id);
                        return (
                            <div
                                key={entry.id}
                                className="rounded-lg border border-[#e3e9e3] bg-white"
                            >
                                <button
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F3F7F2]"
                                    onClick={() => toggle(entry.id)}
                                    aria-expanded={isOpen}
                                >
                                    {isOpen ? (
                                        <ChevronDown className="h-4 w-4 shrink-0 text-[#71717a]" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 shrink-0 text-[#71717a]" />
                                    )}
                                    <div className="flex flex-1 items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-[#1f2d22]">
                                                {entry.summary}
                                            </p>
                                            {entry.provider && (
                                                <p className="text-xs text-[#71717a]">
                                                    {entry.provider}
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-xs text-[#71717a]">
                                                {format(
                                                    new Date(entry.date),
                                                    'dd/MM/yyyy',
                                                    { locale: es },
                                                )}
                                            </p>
                                            <span className="inline-flex rounded-full border border-[#e4e4e7] px-2 py-0.5 text-xs text-[#71717a]">
                                                {entry.type}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                                {isOpen && entry.details && (
                                    <div className="border-t border-[#e3e9e3] px-4 py-3">
                                        <p className="text-sm whitespace-pre-line text-[#333333]">
                                            {entry.details}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
