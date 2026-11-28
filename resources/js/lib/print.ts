import { PRINTABLE_PAGES } from '@/layouts/resolve-layout';

/** Pages whose title is the name the browser offers for the saved PDF */
const FILE_TITLE_PAGES: readonly string[] = [
    ...PRINTABLE_PAGES,
    'portal/estudio',
];

/**
 * Name of a printed document, e.g. «Factura - F-0000008 - Ana Torres».
 * Empty parts are skipped and characters a file name cannot have are dropped.
 */
export function printFileName(...parts: (string | null | undefined)[]): string {
    return parts
        .map((p) =>
            (p ?? '')
                .replace(/[\\/:*?"<>|]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim(),
        )
        .filter(Boolean)
        .join(' - ');
}

/** Clinic date «dd/MM/yyyy[ hh:mm]» as «yyyy-MM-dd», which sorts in a folder */
export function fileDate(date: string | null | undefined): string | null {
    const match = date?.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

    return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

/** Title of the browser tab: printable documents keep theirs as the file name */
export function documentTitle(
    title: string,
    component: string | undefined,
    appName: string,
): string {
    if (component && FILE_TITLE_PAGES.includes(component)) return title;

    return title ? `${title} - ${appName}` : appName;
}
