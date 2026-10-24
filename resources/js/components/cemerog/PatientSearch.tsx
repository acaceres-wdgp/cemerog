/**
 * PatientSearch – shared patient search widget used by Citas and Tablero.
 */
import { useEffect, useRef, useState } from 'react';

export type PatientResult = {
    id: number;
    full_name: string;
    document_number: string;
};

interface PatientSearchProps {
    selected: PatientResult | null;
    query: string;
    onQueryChange: (v: string) => void;
    onSelect: (p: PatientResult) => void;
    onClear: () => void;
    error?: string;
    endpoint: string; // e.g. '/citas/pacientes/buscar'
}

const inputStyle: React.CSSProperties = {
    height: 36,
    width: '100%',
    padding: '0 12px',
    border: '1px solid #e4e4e7',
    borderRadius: 10,
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: 14,
    boxSizing: 'border-box',
};

export default function PatientSearch({
    selected,
    query,
    onQueryChange,
    onSelect,
    onClear,
    error,
    endpoint,
}: PatientSearchProps) {
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
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    height: 36,
                    padding: '0 10px 0 12px',
                    border: '1px solid #B9DC8E',
                    borderRadius: 10,
                    background: '#EEF6E2',
                }}
            >
                <span
                    style={{
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: '#2E8B3E',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                    }}
                >
                    ✓
                </span>
                <span
                    style={{
                        flex: 1,
                        fontWeight: 500,
                        fontSize: 14,
                        color: '#1f2d22',
                    }}
                >
                    {selected.full_name}
                </span>
                <span style={{ fontSize: 12, color: '#56693f' }}>
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
                        color: '#56693f',
                        lineHeight: 1,
                    }}
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
                    borderColor: error ? '#b91c1c' : '#e4e4e7',
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
                <span style={{ color: '#b91c1c', fontSize: 12 }}>{error}</span>
            )}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 200,
                        background: '#fff',
                        border: '1px solid #e3e9e3',
                        borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,.1)',
                        marginTop: 4,
                        overflow: 'hidden',
                    }}
                >
                    {results.length === 0 ? (
                        <div
                            style={{
                                padding: '10px 14px',
                                color: '#71717a',
                                fontSize: 13,
                            }}
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
                                className="hover:bg-table-header-bg"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 14px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f3f4f6',
                                    fontFamily: 'inherit',
                                }}
                            >
                                <div style={{ fontWeight: 500, fontSize: 14 }}>
                                    {p.full_name}
                                </div>
                                <div style={{ color: '#71717a', fontSize: 12 }}>
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
