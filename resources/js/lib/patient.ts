/** «34 años», or a hint when the birth date is not known yet */
export function ageLabel(age: number | null | undefined): string {
    return age === null || age === undefined
        ? 'Edad sin registrar'
        : `${age} años`;
}
