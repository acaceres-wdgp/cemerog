/**
 * TriageBadge – displays triage levels I–V with CEMEROG color coding.
 */

type TriageLevel = 'I' | 'II' | 'III' | 'IV' | 'V';

interface TriageBadgeProps {
    level: TriageLevel;
    className?: string;
}

const TRIAGE_CONFIG: Record<TriageLevel, { label: string; cssClass: string }> =
    {
        I: { label: 'I – Resucitación', cssClass: 'triage-i' },
        II: { label: 'II – Emergencia', cssClass: 'triage-ii' },
        III: { label: 'III – Urgente', cssClass: 'triage-iii' },
        IV: { label: 'IV – Menos urgente', cssClass: 'triage-iv' },
        V: { label: 'V – No urgente', cssClass: 'triage-v' },
    };

export default function TriageBadge({
    level,
    className = '',
}: TriageBadgeProps) {
    const config = TRIAGE_CONFIG[level];

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold ${config.cssClass} bg-[var(--triage-bg)] text-[var(--triage-text)] ${className}`}
            aria-label={config.label}
            title={config.label}
        >
            {level}
        </span>
    );
}
