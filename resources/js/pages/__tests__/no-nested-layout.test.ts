/**
 * Guard test – ensures no page file wraps itself in AppLayout or overrides
 * the global layout defined in app.tsx.
 *
 * The layout is applied automatically by createInertiaApp({ layout }).
 * Pages must return only their content.
 */
import { describe, it, expect } from 'vitest';

// Load every page as raw source text
const pages = import.meta.glob('../**/*.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
});

describe('no-nested-layout', () => {
    it('no page imports layouts/app-layout', () => {
        const violations: string[] = [];
        for (const [path, src] of Object.entries(pages)) {
            if (/import[^'"]+from\s+['"][^'"]*layouts\/app[/-]?[^'"]*layout['"]/.test(src as string)) {
                violations.push(path);
            }
        }
        expect(violations, `Páginas que importan AppLayout: ${violations.join(', ')}`).toEqual([]);
    });

    it('no page renders <AppLayout', () => {
        const violations: string[] = [];
        for (const [path, src] of Object.entries(pages)) {
            if (/<AppLayout[\s/>]/.test(src as string)) {
                violations.push(path);
            }
        }
        expect(violations, `Páginas que renderizan <AppLayout: ${violations.join(', ')}`).toEqual([]);
    });

    it('no page sets .layout to a component or array (only data objects allowed)', () => {
        const violations: string[] = [];
        for (const [path, src] of Object.entries(pages)) {
            // Flag .layout = AppLayout (uppercase) or .layout = [ (array)
            // .layout = { ... }  is a data object (settings breadcrumbs) and is allowed
            if (/\.layout\s*=\s*[A-Z\[]/.test(src as string)) {
                violations.push(path);
            }
        }
        expect(violations, `Páginas que asignan .layout a un componente: ${violations.join(', ')}`).toEqual([]);
    });
});
