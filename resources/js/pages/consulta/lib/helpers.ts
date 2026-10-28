// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tailwind class string for table header cells (RecetaTab).
 * Replaces the old `thStyle` CSSProperties object.
 */
export const thCls =
    'text-left font-semibold text-[11.5px] tracking-[.05em] uppercase text-table-header-text px-3 h-10 bg-table-header-bg border-b border-success-border whitespace-nowrap';

export function initials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

export function computeImc(peso: number | null, talla: number | null): string {
    if (!peso || !talla || talla === 0) return '—';
    const pesoKg = peso / 10;
    const tallaMt = talla / 100;
    const imc = pesoKg / (tallaMt * tallaMt);
    const cat =
        imc < 18.5
            ? 'Bajo'
            : imc < 25
              ? 'Normal'
              : imc < 30
                ? 'Sobrepeso'
                : 'Obesidad';
    return `${imc.toFixed(1)} ${cat}`;
}
