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

/** Units measured by volume or weight are not counted as pieces */
const NOT_COUNTABLE =
    /\b(ml|cc|mg|mcg|g|gr|l|ui|u|gotas?|puff|puffs|inhalaciones?)\b/;

const normalize = (s: string) =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim();

/** «1», «1.5», «1/2», «½», «una» → number */
function leadingNumber(text: string): number | null {
    const t = text.replace('½', '1/2').replace('¼', '1/4');
    const fraction = t.match(/^(\d+)\s*\/\s*(\d+)/);
    if (fraction) return Number(fraction[1]) / Number(fraction[2]);
    const number = t.match(/^(\d+(?:[.,]\d+)?)/);
    if (number) return Number(number[1].replace(',', '.'));
    const word = t.match(/^([a-z]+)/);

    return word && word[1] in WORDS ? WORDS[word[1]] : null;
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
        return leadingNumber(times[1] ?? times[2]);
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

/** «1 cápsula» → 1, «1/2 tableta» → 0.5; null for ml, mg, drops or no number */
export function unitsPerDose(dose: string): number | null {
    const d = normalize(dose);
    if (d === '' || NOT_COUNTABLE.test(d)) return null;

    return leadingNumber(d);
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
    if (days < 1 || perDose === null || perDay === null) return null;

    return Math.ceil(perDose * perDay * days);
}
