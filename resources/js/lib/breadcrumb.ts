/**
 * resolveBreadcrumb – resolves section and page label from a URL.
 *
 * Algorithm:
 *  1. Exact match wins.
 *  2. Prefix match: URL starts with `${href}/` (sub-page). Longest href wins.
 *  3. If a `fallback.page` is provided and a parent was found, the parent's
 *     section is kept but the page label is replaced with the fallback.
 *  4. If a `fallback.subPage` is provided and a parent was found, it is merged
 *     into the result as the third breadcrumb level.
 *  5. Returns null when nothing matches and no useful fallback is given.
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { NavGroup } from './navigation';

export interface BreadcrumbResult {
    section: string;
    page: string;
    subPage?: string;
}

export function resolveBreadcrumb(
    url: string,
    groups: NavGroup[],
    fallback?: { section?: string; page?: string; subPage?: string },
): BreadcrumbResult | null {
    let best: { section: string; page: string } | null = null;
    let bestLen = -1;

    for (const group of groups) {
        for (const item of group.items) {
            const { href } = item;
            if (url === href || url.startsWith(`${href}/`)) {
                if (href.length > bestLen) {
                    bestLen = href.length;
                    best = { section: group.section, page: item.label };
                }
            }
        }
    }

    if (best) {
        return {
            section: fallback?.section ?? best.section,
            page: fallback?.page ?? best.page,
            ...(fallback?.subPage ? { subPage: fallback.subPage } : {}),
        };
    }

    if (fallback?.section && fallback?.page) {
        return {
            section: fallback.section,
            page: fallback.page,
            ...(fallback.subPage ? { subPage: fallback.subPage } : {}),
        };
    }

    return null;
}

export function formatTopbarDate(date: Date): string {
    const formatted = format(date, 'EEEE, dd/MM/yyyy', { locale: es });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
