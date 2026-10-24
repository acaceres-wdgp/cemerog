import type { TurnRow } from '../types';

interface StatCardsProps {
    turns: TurnRow[];
}

export function StatCards({ turns }: StatCardsProps) {
    const STATS = [
        {
            label: 'En espera',
            n: turns.filter((t) => t.status === 'espera').length,
            dot: '#D97706',
            nc: '#92400E',
            sub: 'Sala de espera',
        },
        {
            label: 'En consulta',
            n: turns.filter((t) => t.status === 'en_consulta').length,
            dot: '#2563EB',
            nc: '#1E40AF',
            sub: '—',
        },
        { label: 'Emergencia', n: 0, dot: '#DC2626', nc: '#991B1B', sub: '—' },
        { label: 'Internados', n: 0, dot: '#7C3AED', nc: '#5B21B6', sub: '—' },
        { label: 'Total hoy', n: 0, dot: '#2E8B3E', nc: '#1f2d22', sub: '—' },
    ];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                gap: 12,
            }}
        >
            {STATS.map((k) => (
                <div
                    key={k.label}
                    style={{
                        background: '#fff',
                        border: '1px solid #e3e9e3',
                        borderRadius: 14,
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 11.5,
                            fontWeight: 600,
                            letterSpacing: '.06em',
                            textTransform: 'uppercase',
                            color: '#52605a',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <span
                            style={{
                                flexShrink: 0,
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: k.dot,
                            }}
                        />
                        {k.label}
                    </div>
                    <div
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontSize: 34,
                            fontWeight: 700,
                            lineHeight: 1.1,
                            color: k.nc,
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        {k.n}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#8a948e' }}>
                        {k.sub}
                    </div>
                </div>
            ))}
        </div>
    );
}
