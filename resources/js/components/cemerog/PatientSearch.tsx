/**
 * PatientSearch – shared patient search widget used by Citas and Tablero.
 */
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type PatientResult = {
    id: number;
    full_name: string;
    document_number: string;
};

export default function PatientSearch({
    selected,
    query,
    onQueryChange,
    onSelect,
    onClear,
    error,
    endpoint,
}: {
    selected: PatientResult | null;
    query: string;
    onQueryChange: (v: string) => void;
    onSelect: (p: PatientResult) => void;
    onClear: () => void;
    error?: string;
    endpoint: string;
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
                    `${endpoint}?q=${encodeURIComponent(query)}`,
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
    }, [query, selected, endpoint]);

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
            <div className="flex h-9 items-center gap-2.5 rounded-[10px] border border-accent-border bg-accent-bg pr-2.5 pl-3">
                <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    ✓
                </span>
                <span className="flex-1 text-sm font-medium text-text-heading">
                    {selected.full_name}
                </span>
                <span className="text-xs text-table-header-text">
                    {selected.document_number}
                </span>
                <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex h-[22px] w-[22px] shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-black/[.08] text-xs leading-none text-table-header-text"
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
                    'box-border h-9 w-full rounded-[10px] border px-3 font-[inherit] text-sm outline-none',
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
            {error && <span className="text-xs text-error">{error}</span>}
            {open && (
                <div className="absolute top-full right-0 left-0 z-[200] mt-1 overflow-hidden rounded-[10px] border border-card-border bg-white shadow-[0_8px_24px_rgba(0,0,0,.1)]">
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
                                className="block w-full cursor-pointer border-0 border-b border-row-separator bg-transparent px-3.5 py-[10px] text-left font-[inherit] hover:bg-table-header-bg"
                            >
                                <div className="text-sm font-medium">
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
