/**
 * Messages for an upload the server did not save. Without them Inertia either
 * shows its raw error dialog or, when the connection is cut mid-upload,
 * nothing at all, and the user believes the file was saved.
 */

export const MAX_UPLOAD_MB = 20;

type Context = {
    /** What was lost, e.g. «No se guardaron los cambios» for a whole form */
    notSaved?: string;
    /** Files sent together: with several, uploading them apart may fit */
    fileCount?: number;
};

/** Over the per-file limit the server validates (max:20480 KB) */
export function tooLargeMessage(file: File): string | null {
    if (file.size <= MAX_UPLOAD_MB * 1024 * 1024) return null;
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `«${file.name}» pesa ${mb} MB. El máximo es ${MAX_UPLOAD_MB} MB por archivo. No se subió nada.`;
}

/** The server answered with an error instead of saving */
export function httpFailureMessage(
    status: number,
    { notSaved = 'No se guardó', fileCount = 1 }: Context = {},
): string {
    if (status === 413) {
        const apart = fileCount > 1 ? ' o súbelos de uno en uno' : '';
        return `El servidor no aceptó el archivo por su tamaño. ${notSaved}: prueba con un archivo más pequeño${apart}.`;
    }
    return `No se pudo subir el archivo (error ${status}). ${notSaved}: intenta de nuevo.`;
}

/** No answer: the connection dropped, which a proxy may do on a large upload */
export function networkFailureMessage({
    notSaved = 'No se guardó',
}: Context = {}): string {
    return `Se cortó la conexión mientras se subía. ${notSaved}: revisa tu conexión o prueba con un archivo más pequeño.`;
}
