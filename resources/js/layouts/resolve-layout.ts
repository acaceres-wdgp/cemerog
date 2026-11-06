import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';

/**
 * Printable documents (opened in a new tab) render without the app layout:
 * their print CSS hides everything under #app except `.printable-root`, so
 * the document must be a direct child of #app or it prints blank.
 */
export const PRINTABLE_PAGES = [
    'consulta/receta-imprimir',
    'lab/imprimir',
    'img/imprimir',
    'caja/factura-imprimir',
    'caja/recibo-imprimir',
    'cuadre/reporte',
] as const;

/** The single place that decides each page's layout (used by createInertiaApp) */
export function resolveLayout(name: string) {
    if ((PRINTABLE_PAGES as readonly string[]).includes(name)) {
        return undefined;
    }

    return name.startsWith('auth/') ? AuthLayout : AppLayout;
}
