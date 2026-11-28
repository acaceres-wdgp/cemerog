/**
 * Quantity to dispense of a prescription line: units per dose × doses per day
 * × days, rounded up. Only when the line allows it (a countable dose such as
 * «1 cápsula» and a regular frequency such as «cada 8 horas»); otherwise the
 * doctor types it.
 */

const WORDS: Record<string, number> = {
    una: 1,
    un: 1,
    uno: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
};

/**
 * Units measured by volume or weight are not counted as pieces. Only the unit
 * right after the amount counts, joined or not: «500mg» and «5 ml» are not
 * pieces, «1 tableta de 500 mg» is one tablet.
 */
const NOT_COUNTABLE =
    /^\s*(ml|cc|mg|mcg|g|gr|l|ui|u|gotas?|puff|puffs|inhalaciones?)(?![a-z])/;

const normalize = (s: string) =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim();

/** «1», «1.5», «1/2», «½», «una» → the number and the text after it */
function leadingNumber(text: string): { value: number; rest: string } | null {
    const t = text.replace('½', '1/2').replace('¼', '1/4');
    const fraction = t.match(/^(\d+)\s*\/\s*(\d+)/);
    if (fraction) {
        return {
            value: Number(fraction[1]) / Number(fraction[2]),
            rest: t.slice(fraction[0].length),
        };
    }
    const number = t.match(/^(\d+(?:[.,]\d+)?)/);
    if (number) {
        return {
            value: Number(number[1].replace(',', '.')),
            rest: t.slice(number[0].length),
        };
    }
    const word = t.match(/^([a-z]+)/);

    return word && word[1] in WORDS
        ? { value: WORDS[word[1]], rest: t.slice(word[0].length) }
        : null;
}

/** «cada 8 horas» → 3, «2 veces al día» → 2, «diario» → 1; null if irregular */
export function dosesPerDay(frequency: string): number | null {
    const f = normalize(frequency);
    if (f === '') return null;

    const hours = f.match(/(?:cada|c\/)\s*(\d+)\s*(?:h|hr|hrs|hora|horas)\b/);
    if (hours) {
        const n = Number(hours[1]);
        return n > 0 && 24 % n === 0 ? 24 / n : null;
    }
    const times = f.match(/^(\S+)\s+vez|^(\S+)\s+veces/);
    if (times && /(al|por|cada)\s+dia/.test(f)) {
        return leadingNumber(times[1] ?? times[2])?.value ?? null;
    }
    if (
        /^(diario|diaria|cada dia|cada noche|cada manana|al dia|una vez)$/.test(
            f,
        )
    ) {
        return 1;
    }

    return null;
}

/** «1 cápsula» → 1, «1/2 tableta» → 0.5; null for ml, mg, drops, zero or no number */
export function unitsPerDose(dose: string): number | null {
    const amount = leadingNumber(normalize(dose));
    if (amount === null || NOT_COUNTABLE.test(amount.rest)) return null;

    return Number.isFinite(amount.value) && amount.value > 0
        ? amount.value
        : null;
}

export function computeQuantity(line: {
    dose: string;
    frequency: string;
    duration_days: string;
    is_continuous: boolean;
}): number | null {
    if (line.is_continuous) return null;
    const days = /^\d+$/.test(line.duration_days.trim())
        ? parseInt(line.duration_days, 10)
        : 0;
    const perDose = unitsPerDose(line.dose);
    const perDay = dosesPerDay(line.frequency);
    if (days < 1 || perDose === null || !perDay) return null;

    return Math.ceil(perDose * perDay * days);
}
