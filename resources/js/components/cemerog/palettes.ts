/**
 * palettes.ts – dynamic color palettes for doctor avatars and cita status badges.
 * These are runtime-computed values (indexed by ID or status) and cannot be
 * expressed as static Tailwind classes.
 */

// Dynamic palette for doctor avatars — indexed by doctor_id % length at runtime
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
