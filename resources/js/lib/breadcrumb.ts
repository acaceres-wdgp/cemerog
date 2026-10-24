/**
 * resolveBreadcrumb – resolves section and page label from a URL.
 *
 * Algorithm:
 *  1. Exact match wins.
 *  2. Prefix match: URL starts with `${href}/` (sub-page). Longest href wins.
 *  3. If a `fallback.page` is provided and a parent was found, the parent's
 *     section is kept but the page label is replaced with the fallback.
 *  4. Returns null when nothing matches and no useful fallback is given.
 */

import type { NavGroup } from './navigation';

export interface BreadcrumbResult {
    section: string;
    page: string;
}

export function resolveBreadcrumb(
    url: string,
    groups: NavGroup[],
    fallback?: { section?: string; page?: string },
): BreadcrumbResult | null {
    let best: { section: string; page: string; hrefLen: number } | null = null;

    for (const group of groups) {
        for (const item of group.items) {
            const { href } = item;
            if (url === href || url.startsWith(`${href}/`)) {
                if (!best || href.length > best.hrefLen) {
                    best = {
                        section: group.section,
                        page: item.label,
                        hrefLen: href.length,
                    };
                }
            }
        }
    }

    if (!best && !fallback) return null;

    // If no match at all and no fallback section, bail out
    if (!best && !fallback?.section && !fallback?.page) return null;

    return {
        section: fallback?.section ?? best?.section ?? '',
        page: fallback?.page ?? best?.page ?? '',
    };
}
