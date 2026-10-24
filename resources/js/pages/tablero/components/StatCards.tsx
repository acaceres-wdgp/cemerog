import type { TurnRow } from '../types';

interface StatCardsProps {
    turns: TurnRow[];
}

type StatConfig = {
    label: string;
    n: number;
    dotClass: string;
    numClass: string;
    sub: string;
};

export function StatCards({ turns }: StatCardsProps) {
    const STATS: StatConfig[] = [
        {
            label: 'En espera',
            n: turns.filter((t) => t.status === 'espera').length,
            dotClass: 'bg-espera-dot',
            numClass: 'text-espera-num',
            sub: 'Sala de espera',
        },
        {
            label: 'En consulta',
            n: turns.filter((t) => t.status === 'en_consulta').length,
            dotClass: 'bg-consulta-dot',
            numClass: 'text-consulta-num',
            sub: '—',
        },
        {
            label: 'Emergencia',
            n: 0,
            dotClass: 'bg-emergencia-dot',
            numClass: 'text-emergencia-num',
            sub: '—',
        },
        {
            label: 'Internados',
            n: 0,
            dotClass: 'bg-internado-dot',
            numClass: 'text-internado-num',
            sub: '—',
        },
        {
            label: 'Total hoy',
            n: 0,
            dotClass: 'bg-primary',
            numClass: 'text-text-heading',
            sub: '—',
        },
    ];

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
            {STATS.map((k) => (
                <div
                    key={k.label}
                    className="flex flex-col gap-1.5 rounded-[14px] border border-card-border bg-card-bg p-[18px_20px]"
                >
                    <div className="flex items-center gap-2 text-[11.5px] font-semibold tracking-[.06em] whitespace-nowrap text-secondary-fg uppercase">
                        <span
                            className={`h-[7px] w-[7px] shrink-0 rounded-full ${k.dotClass}`}
                        />
                        {k.label}
                    </div>
                    <div
                        className={`font-serif text-[34px] leading-[1.1] font-bold tabular-nums ${k.numClass}`}
                    >
                        {k.n}
                    </div>
                    <div className="text-[12.5px] text-text-tertiary">
                        {k.sub}
                    </div>
                </div>
            ))}
        </div>
    );
}
