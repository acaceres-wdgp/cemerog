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
                                ? 'border-error-border bg-error-bg'
                                : 'border-card-border bg-white'
                        }`}
                    >
                        <p className="text-xs font-medium text-muted">
                            {vital.label}
                        </p>
                        <p
                            className={`mt-1 text-lg font-semibold tabular-nums ${
                                outOfRange ? 'text-error' : 'text-text-heading'
                            }`}
                        >
                            {vital.value}
                            {vital.unit && (
                                <span className="ml-1 text-xs font-normal text-muted">
                                    {vital.unit}
                                </span>
                            )}
                        </p>
                        {outOfRange && (
                            <p className="mt-0.5 text-xs text-error">
                                Fuera de rango
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
