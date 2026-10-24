import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { PatientResult } from '../types';

export function PatientSearch({
    selected,
    query,
    onQueryChange,
    onSelect,
    onClear,
    error,
}: {
    selected: PatientResult | null;
    query: string;
    onQueryChange: (v: string) => void;
    onSelect: (p: PatientResult) => void;
    onClear: () => void;
    error?: string;
}) {
    const [results, setResults] = useState<PatientResult[]>([]);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selected) {
            setOpen(false);
            return;
        }
        if (query.length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/citas/pacientes/buscar?q=${encodeURIComponent(query)}`,
                );
                if (!res.ok) {
                    setResults([]);
                    setOpen(true);
                    return;
                }
                const data: PatientResult[] = await res.json();
                setResults(Array.isArray(data) ? data : []);
                setOpen(true);
            } catch {
                setResults([]);
                setOpen(true);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [query, selected]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (selected) {
        return (
            <div className="flex items-center gap-2.5 h-9 pr-2.5 pl-3 rounded-[10px] border border-accent-border bg-accent-bg">
                <span className="w-[22px] h-[22px] shrink-0 rounded-full inline-flex items-center justify-center text-[10px] font-bold bg-primary text-white">
                    ✓
                </span>
                <span className="flex-1 font-medium text-sm text-text-heading">
                    {selected.full_name}
                </span>
                <span className="text-xs text-table-header-text">
                    {selected.document_number}
                </span>
                <button
                    type="button"
                    onClick={onClear}
                    className="w-[22px] h-[22px] shrink-0 border-0 rounded-md bg-black/[.08] cursor-pointer inline-flex items-center justify-center text-xs leading-none text-table-header-text"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div ref={ref} className="relative">
            <input
                className={cn(
                    'h-9 w-full rounded-[10px] border px-3 text-sm outline-none box-border font-[inherit]',
                    error ? 'border-error' : 'border-input-border',
                )}
                value={query}
                onChange={(e) => {
                    onQueryChange(e.target.value);
                    if (!e.target.value) setOpen(false);
                }}
                placeholder="Buscar por nombre o cédula…"
                autoComplete="off"
                autoFocus
            />
            {error && (
                <span className="text-xs text-error">{error}</span>
            )}
            {open && (
                <div className="absolute top-full left-0 right-0 z-[200] rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,.1)] mt-1 overflow-hidden border border-card-border bg-white">
                    {results.length === 0 ? (
                        <div className="px-3.5 py-[10px] text-[13px] text-muted">
                            No se encontraron pacientes.
                        </div>
                    ) : (
                        results.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                    onSelect(p);
                                    setOpen(false);
                                }}
                                className="block w-full text-left px-3.5 py-[10px] border-0 bg-transparent cursor-pointer font-[inherit] border-b border-row-separator hover:bg-table-header-bg"
                            >
                                <div className="font-medium text-sm">
                                    {p.full_name}
                                </div>
                                <div className="text-xs text-muted">
                                    {p.document_number}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
