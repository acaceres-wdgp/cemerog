/**
 * TriageBadge – displays triage levels I–V with CEMEROG color coding.
 */

type TriageLevel = 'I' | 'II' | 'III' | 'IV' | 'V';

interface TriageBadgeProps {
    level: TriageLevel;
    className?: string;
}

const TRIAGE_CONFIG: Record<TriageLevel, { label: string; bg: string; text: string }> = {
    I:   { label: 'I – Resucitación',  bg: '#DC2626', text: '#FFFFFF' },
    II:  { label: 'II – Emergencia',   bg: '#EA580C', text: '#FFFFFF' },
    III: { label: 'III – Urgente',     bg: '#F59E0B', text: '#3b2a00' },
    IV:  { label: 'IV – Menos urgente', bg: '#2E8B3E', text: '#FFFFFF' },
    V:   { label: 'V – No urgente',    bg: '#2563EB', text: '#FFFFFF' },
};

export default function TriageBadge({ level, className = '' }: TriageBadgeProps) {
    const config = TRIAGE_CONFIG[level];

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold ${className}`}
            style={{ backgroundColor: config.bg, color: config.text }}
            aria-label={config.label}
            title={config.label}
        >
            {level}
        </span>
    );
}
