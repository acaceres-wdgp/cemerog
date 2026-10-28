import React from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const thStyle: React.CSSProperties = {
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 11.5,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    color: '#56693f',
    padding: '0 12px',
    height: 40,
    background: '#F6FAF1',
    borderBottom: '1px solid #DCEBC9',
    whiteSpace: 'nowrap',
};

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
