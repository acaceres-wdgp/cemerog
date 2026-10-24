import { useEffect, useRef, useState } from 'react';
import { PatientResult } from '../types';

const inputStyle: React.CSSProperties = {
    height: 36,
    width: '100%',
    padding: '0 12px',
    borderRadius: 10,
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: 14,
    boxSizing: 'border-box',
};

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
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    height: 36,
                    padding: '0 10px 0 12px',
                    borderRadius: 10,
                }}
                className="border border-accent-border bg-accent-bg"
            >
                <span
                    style={{
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                    }}
                    className="bg-primary text-white"
                >
                    ✓
                </span>
                <span
                    style={{
                        flex: 1,
                        fontWeight: 500,
                        fontSize: 14,
                    }}
                    className="text-text-heading"
                >
                    {selected.full_name}
                </span>
                <span
                    style={{ fontSize: 12 }}
                    className="text-table-header-text"
                >
                    {selected.document_number}
                </span>
                <button
                    type="button"
                    onClick={onClear}
                    style={{
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        border: 'none',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,.08)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        lineHeight: 1,
                    }}
                    className="text-table-header-text"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <input
                style={{
                    ...inputStyle,
                    border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-input-border)'}`,
                }}
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
                <span style={{ fontSize: 12 }} className="text-error">
                    {error}
                </span>
            )}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 200,
                        borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,.1)',
                        marginTop: 4,
                        overflow: 'hidden',
                    }}
                    className="border border-card-border bg-white"
                >
                    {results.length === 0 ? (
                        <div
                            style={{
                                padding: '10px 14px',
                                fontSize: 13,
                            }}
                            className="text-muted"
                        >
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
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 14px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                                className="border-b border-row-separator"
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                        'var(--color-table-header-bg)')
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = 'none')
                                }
                            >
                                <div style={{ fontWeight: 500, fontSize: 14 }}>
                                    {p.full_name}
                                </div>
                                <div
                                    style={{ fontSize: 12 }}
                                    className="text-muted"
                                >
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
