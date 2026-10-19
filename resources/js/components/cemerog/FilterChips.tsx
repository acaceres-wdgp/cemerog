/**
 * FilterChips – single or multi-select filter chips.
 */

interface FilterChip<T extends string = string> {
    value: T;
    label: string;
    count?: number;
}

interface FilterChipsProps<T extends string = string> {
    chips: FilterChip<T>[];
    value: T | T[];
    onChange: (value: T | T[]) => void;
    multiple?: boolean;
    className?: string;
}

export default function FilterChips<T extends string = string>({
    chips,
    value,
    onChange,
    multiple = false,
    className = '',
}: FilterChipsProps<T>) {
    const selected = Array.isArray(value) ? value : [value];

    const handleClick = (chipValue: T) => {
        if (multiple) {
            const arr = Array.isArray(value) ? value : [value];
            const next = arr.includes(chipValue)
                ? arr.filter((v) => v !== chipValue)
                : [...arr, chipValue];
            onChange(next as T[]);
        } else {
            onChange(chipValue);
        }
    };

    return (
        <div className={`flex flex-wrap gap-2 ${className}`} role="group">
            {chips.map((chip) => {
                const active = selected.includes(chip.value);
                return (
                    <button
                        key={chip.value}
                        type="button"
                        onClick={() => handleClick(chip.value)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            active
                                ? 'border-[#2E8B3E] bg-[#EEF6E2] text-[#2f4a17]'
                                : 'border-[#e4e4e7] bg-white text-[#71717a] hover:border-[#2E8B3E] hover:text-[#333333]'
                        }`}
                    >
                        {chip.label}
                        {chip.count !== undefined && (
                            <span className={`font-semibold ${active ? 'text-[#2E8B3E]' : ''}`}>
                                {chip.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
