/**
 * VitalsGrid – displays patient vital signs with out-of-range highlighting.
 */

interface VitalSign {
    label: string;
    value: string | number;
    unit?: string;
    normalRange?: [number, number];
    numericValue?: number;
}

interface VitalsGridProps {
    vitals: VitalSign[];
    className?: string;
}

function isOutOfRange(vital: VitalSign): boolean {
    if (!vital.normalRange || vital.numericValue === undefined) return false;
    const [min, max] = vital.normalRange;
    return vital.numericValue < min || vital.numericValue > max;
}

export default function VitalsGrid({
    vitals,
    className = '',
}: VitalsGridProps) {
    return (
        <div
            className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${className}`}
        >
            {vitals.map((vital, i) => {
                const outOfRange = isOutOfRange(vital);
                return (
                    <div
                        key={i}
                        className={`rounded-lg border p-3 ${
                            outOfRange
                                ? 'border-[#fecaca] bg-[#fef2f2]'
                                : 'border-[#e3e9e3] bg-white'
                        }`}
                    >
                        <p className="text-xs font-medium text-[#71717a]">
                            {vital.label}
                        </p>
                        <p
                            className={`mt-1 text-lg font-semibold tabular-nums ${
                                outOfRange ? 'text-[#b91c1c]' : 'text-[#1f2d22]'
                            }`}
                        >
                            {vital.value}
                            {vital.unit && (
                                <span className="ml-1 text-xs font-normal text-[#71717a]">
                                    {vital.unit}
                                </span>
                            )}
                        </p>
                        {outOfRange && (
                            <p className="mt-0.5 text-xs text-[#b91c1c]">
                                Fuera de rango
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
