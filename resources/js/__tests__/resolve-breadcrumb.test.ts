import { describe, expect, it } from 'vitest';
import { NAV_GROUPS } from '@/lib/navigation';
import { resolveBreadcrumb } from '@/lib/breadcrumb';

describe('resolveBreadcrumb', () => {
    // Exact matches
    it.each([
        ['/tablero',           'Recepción',        'Tablero de atenciones'],
        ['/pacientes',         'Recepción',         'Pacientes'],
        ['/registro',          'Recepción',         'Registro de pacientes'],
        ['/citas',             'Recepción',         'Citas'],
        ['/consulta',          'Atención clínica',  'Consulta'],
        ['/facturacion',       'Caja',              'Facturación'],
        ['/inicio',            'General',           'Inicio'],
        ['/admin/doctores',    'Administración',    'Doctores y especialidades'],
        ['/admin/usuarios',    'Administración',    'Usuarios y roles'],
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
        expect(resolveBreadcrumb('/admin/doctores/5/editar', NAV_GROUPS)).toEqual({
            section: 'Administración',
            page: 'Doctores y especialidades',
        });
    });

    // Unknown route – no fallback
    it('returns null for unknown routes without fallback', () => {
        expect(resolveBreadcrumb('/ruta-desconocida', NAV_GROUPS)).toBeNull();
    });

    // Fallback page override (parent section kept)
    it('uses fallback.page while keeping parent section', () => {
        expect(
            resolveBreadcrumb('/pacientes/5/editar', NAV_GROUPS, { page: 'Editar paciente' }),
        ).toEqual({ section: 'Recepción', page: 'Editar paciente' });
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
