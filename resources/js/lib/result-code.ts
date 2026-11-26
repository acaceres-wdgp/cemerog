/**
 * Results portal inputs, formatted as the patient types (as in the design):
 * the code as CMG-XXXX-XXXX and the birth date as DD/MM/AAAA.
 */

/** Uppercase letters and digits only */
export const normalizeCode = (value: string) =>
    value.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** «cmg7k4p29xq» → «CMG-7K4P-29XQ»; the CMG prefix is optional */
export function formatCode(value: string): string {
    let code = normalizeCode(value);
    if (code.startsWith('CMG')) code = code.slice(3);
    code = code.slice(0, 8);
    if (code === '') return '';

    return `CMG-${code.slice(0, 4)}${code.length > 4 ? `-${code.slice(4)}` : ''}`;
}

/** Digits only, with the slashes added: «21051992» → «21/05/1992» */
export function formatBirthDate(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 8);
    if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
    if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;

    return d;
}

/** The 8 characters of the code and a full date */
export const isComplete = (code: string, birthDate: string) =>
    normalizeCode(code).replace(/^CMG/, '').length === 8 &&
    /^\d{2}\/\d{2}\/\d{4}$/.test(birthDate);
