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

// Dynamic cita status badge colors — keyed by cita.status at runtime
export const CITA_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
    pendiente: { bg: '#FEF3C7', fg: '#92400E' },
    confirmada: { bg: '#DBEAFE', fg: '#1E40AF' },
    no_asistio: { bg: '#F4F4F5', fg: '#52525B' },
    cancelada: { bg: '#F4F4F5', fg: '#52525B' },
    atendida: { bg: '#DCFCE7', fg: '#166534' },
    en_lista: { bg: '#DBEAFE', fg: '#1E40AF' },
};

// Fallback badge color for unknown statuses
export const BADGE_FALLBACK: { bg: string; fg: string } = {
    bg: '#F4F4F5',
    fg: '#52525B',
};
