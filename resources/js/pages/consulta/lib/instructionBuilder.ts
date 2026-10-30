// ─── Instruction Builder ──────────────────────────────────────────────────────

export type InstructionItem = {
    dose: string;
    route: string | null | undefined;
    frequency: string;
    duration_days: number | null | undefined;
    is_continuous: boolean;
};

/**
 * Builds a human-readable instruction string from a prescription item.
 * Example: «Tomar 1 tableta por vía oral cada 12 horas durante 7 días.»
 * Continuous: «Tomar 1 tableta por vía oral cada 12 horas de forma continua.»
 */
export function buildInstruction(item: InstructionItem): string {
    const verb = 'Tomar';
    const base = `${verb} ${item.dose}`;
    const via = item.route ? ` por vía ${item.route}` : '';
    const freq = ` ${item.frequency.toLowerCase()}`;
    const dur = item.is_continuous
        ? ' de forma continua.'
        : ` durante ${item.duration_days} días.`;
    return `${base}${via}${freq}${dur}`;
}
