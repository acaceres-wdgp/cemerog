import { describe, expect, it } from 'vitest';
import { NAV_GROUPS } from '@/lib/navigation';
import { resolveBreadcrumb, formatTopbarDate } from '@/lib/breadcrumb';

describe('resolveBreadcrumb', () => {
    // Exact matches
    it.each([
        ['/tablero', 'Recepción', 'Tablero de atenciones'],
        ['/pacientes', 'Recepción', 'Pacientes'],
        ['/citas', 'Recepción', 'Citas'],
        ['/consulta', 'Atención clínica', 'Consulta'],
        ['/facturacion', 'Caja', 'Facturación'],
        ['/inicio', 'General', 'Inicio'],
        ['/admin/doctores', 'Administración', 'Doctores y especialidades'],
        ['/admin/usuarios', 'Administración', 'Usuarios y roles'],
    ])('exact match: %s → %s › %s', (url, section, page) => {
        expect(resolveBreadcrumb(url, NAV_GROUPS)).toEqual({ section, page });
    });

    // Prefix (sub-route) matches
    it('sub-route /pacientes/123 resolves to Pacientes section', () => {
        expect(resolveBreadcrumb('/pacientes/123', NAV_GROUPS)).toEqual({
            section: 'Recepción',
            page: 'Pacientes',
        });
    });

    it('deep sub-route /admin/doctores/5/editar resolves to Doctores', () => {
        expect(
            resolveBreadcrumb('/admin/doctores/5/editar', NAV_GROUPS),
        ).toEqual({
            section: 'Administración',
            page: 'Doctores y especialidades',
        });
    });

    // Unknown route – no fallback
    it('returns null for unknown routes without fallback', () => {
        expect(resolveBreadcrumb('/ruta-desconocida', NAV_GROUPS)).toBeNull();
    });

    // /registro is no longer in nav; returns null without fallback
    it('returns null for /registro without fallback (registro removed from nav)', () => {
        expect(resolveBreadcrumb('/registro', NAV_GROUPS)).toBeNull();
    });

    // Fallback page override (parent section kept)
    it('uses fallback.page while keeping parent section', () => {
        expect(
            resolveBreadcrumb('/pacientes/5/editar', NAV_GROUPS, {
                page: 'Editar paciente',
            }),
        ).toEqual({ section: 'Recepción', page: 'Editar paciente' });
    });

    // subPage from fallback merged into found match
    it('merges fallback.subPage into a found match', () => {
        expect(
            resolveBreadcrumb('/pacientes/5/editar', NAV_GROUPS, {
                subPage: 'Editar',
            }),
        ).toEqual({
            section: 'Recepción',
            page: 'Pacientes',
            subPage: 'Editar',
            pageHref: '/pacientes',
        });
    });

    it('/pacientes/{id} profile → Recepción › Pacientes (link) › Perfil del paciente', () => {
        expect(
            resolveBreadcrumb('/pacientes/12', NAV_GROUPS, {
                subPage: 'Perfil del paciente',
            }),
        ).toEqual({
            section: 'Recepción',
            page: 'Pacientes',
            subPage: 'Perfil del paciente',
            pageHref: '/pacientes',
        });
    });

    // 3-level breadcrumb via full fallback for /registro (not in nav)
    it('/registro + full fallback → Recepción › Pacientes › Nuevo paciente', () => {
        expect(
            resolveBreadcrumb('/registro', NAV_GROUPS, {
                section: 'Recepción',
                page: 'Pacientes',
                subPage: 'Nuevo paciente',
            }),
        ).toEqual({
            section: 'Recepción',
            page: 'Pacientes',
            subPage: 'Nuevo paciente',
        });
    });

    it('/registro + full fallback → Recepción › Pacientes › Nueva atención', () => {
        expect(
            resolveBreadcrumb('/registro', NAV_GROUPS, {
                section: 'Recepción',
                page: 'Pacientes',
                subPage: 'Nueva atención',
            }),
        ).toEqual({
            section: 'Recepción',
            page: 'Pacientes',
            subPage: 'Nueva atención',
        });
    });

    // Fully custom fallback for truly unknown routes
    it('uses full fallback for routes with no parent in nav', () => {
        expect(
            resolveBreadcrumb('/ruta-desconocida', NAV_GROUPS, {
                section: 'General',
                page: 'Página personalizada',
            }),
        ).toEqual({ section: 'General', page: 'Página personalizada' });
    });
});

describe('formatTopbarDate', () => {
    it('formats Oct 24, 2026 (Saturday) as Sábado, 24/10/2026', () => {
        expect(formatTopbarDate(new Date(2026, 9, 24))).toBe(
            'Sábado, 24/10/2026',
        );
    });

    it('formats Jan 1, 2026 (Thursday) as Jueves, 01/01/2026', () => {
        expect(formatTopbarDate(new Date(2026, 0, 1))).toBe(
            'Jueves, 01/01/2026',
        );
    });
});
