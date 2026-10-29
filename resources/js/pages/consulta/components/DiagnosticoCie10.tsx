import React from 'react';
import { cn } from '@/lib/utils';
import { Diagnostico } from '../types';

// ─── Diagnóstico CIE-10 ───────────────────────────────────────────────────────

type Props = {
    diagnosticos: Diagnostico[];
    dxInput: string;
    onDxInputChange: (value: string) => void;
    onAddDx: () => void;
    onRemoveDx: (index: number) => void;
};

export default function DiagnosticoCie10({
    diagnosticos,
    dxInput,
    onDxInputChange,
    onAddDx,
    onRemoveDx,
}: Props) {
    return (
        <div className="flex flex-col gap-[6px]">
            <span className="font-medium">Diagnóstico (CIE-10)</span>
            <div className="flex min-h-[42px] flex-wrap items-center gap-[6px] rounded-[10px] border border-input-border px-2 py-[5px]">
                {diagnosticos.map((dx: Diagnostico, i: number) => (
                    <span
                        key={i}
                        className="inline-flex items-center gap-[6px] rounded-full bg-muted-bg px-[10px] py-[3px] text-[13px]"
                    >
                        <strong className="font-semibold">{dx.code}</strong>{' '}
                        {dx.label}
                        <button
                            type="button"
                            onClick={() => onRemoveDx(i)}
                            className="cursor-pointer border-0 bg-transparent p-0 text-[13px] text-muted"
                        >
                            ✕
                        </button>
                    </span>
                ))}
                {/* dynamic-style: placeholder color depends on diagnosticos length */}
                <input
                    value={dxInput}
                    onChange={(e) => onDxInputChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            onAddDx();
                        }
                    }}
                    placeholder="Ej: N39.0 Infección de vías urinarias"
                    className={cn(
                        'min-w-[180px] flex-1 border-0 bg-transparent font-sans text-[13px] outline-none',
                        diagnosticos.length === 0
                            ? 'text-muted-light'
                            : 'text-text-heading',
                    )}
                />
            </div>
        </div>
    );
}
