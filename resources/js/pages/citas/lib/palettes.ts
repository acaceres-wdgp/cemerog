/**
 * Doctor avatar color palettes — runtime computed from doctor ID.
 * These are intentionally kept as hex literals (not CSS tokens) because
 * they represent a fixed, ordered set of avatar swatches generated
 * programmatically at render time (docPalette(id) = PALETTES[id % n]).
 */

export const DOC_PALETTES = [
    { bg: '#EEF6E2', fg: '#2E8B3E' },
    { bg: '#DBEAFE', fg: '#1E40AF' },
    { bg: '#EDE9FE', fg: '#5B21B6' },
    { bg: '#FCE7F3', fg: '#9D174D' },
    { bg: '#CFFAFE', fg: '#155E75' },
    { bg: '#FEF3C7', fg: '#92400E' },
];

export const docPalette = (id: number) =>
    DOC_PALETTES[id % DOC_PALETTES.length];
