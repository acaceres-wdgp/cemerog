/**
 * SegmentedControl – pill-style tabs with optional count display.
 * Design tokens: bg #F3F7F2, border #e3e9e3, radius 11px, padding 3px.
 * Active: white background, shadow 0 1px 2px rgba(0,0,0,.08).
 * Counter: plain text 12px #8a948e — no badge/pill.
 */

interface Segment<T extends string = string> {
    value: T;
    label: string;
    count?: number;
}

interface SegmentedControlProps<T extends string = string> {
    segments: Segment<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
}

export default function SegmentedControl<T extends string = string>({
    segments,
    value,
    onChange,
    className = '',
}: SegmentedControlProps<T>) {
    return (
        <div
            className={`inline-flex gap-0.5 rounded-[11px] border border-[#e3e9e3] bg-[#F3F7F2] p-[3px] ${className}`}
            role="tablist"
        >
            {segments.map((seg) => {
                const active = seg.value === value;
                return (
                    <button
                        key={seg.value}
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(seg.value)}
                        className={`inline-flex h-[30px] items-center gap-1.5 rounded-[10px] px-3 text-sm font-[500] transition-all ${
                            active
                                ? 'bg-white text-[#333] shadow-[0_1px_2px_rgba(0,0,0,.08)]'
                                : 'bg-transparent text-[#71717a] hover:text-[#333333]'
                        }`}
                    >
                        {seg.label}
                        {seg.count !== undefined && (
                            <span
                                className="text-[12px] text-[#8a948e] tabular-nums"
                                aria-label={`${seg.count}`}
                            >
                                {seg.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
