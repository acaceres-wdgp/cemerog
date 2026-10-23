/**
 * SegmentedControl – pill-style tabs with optional count badges.
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
            className={`inline-flex gap-1 rounded-lg border border-[#e4e4e7] bg-[#f4f4f5] p-1 ${className}`}
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
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                            active
                                ? 'bg-white text-[#1f2d22] shadow-sm'
                                : 'text-[#71717a] hover:text-[#333333]'
                        }`}
                    >
                        {seg.label}
                        {seg.count !== undefined && (
                            <span
                                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                                    active
                                        ? 'bg-[#EEF6E2] text-[#2E8B3E]'
                                        : 'bg-[#e4e4e7] text-[#71717a]'
                                }`}
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
