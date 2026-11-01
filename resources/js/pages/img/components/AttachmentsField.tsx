import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { FileImage, FileText, Upload, X } from 'lucide-react';
import { fileSize } from '@/components/img/types';
import type { ImagingAttachmentItem } from '@/components/img/types';
import * as attachments from '@/routes/img/attachments';
import * as orders from '@/routes/img/orders';

/** «Archivos adjuntos»: open each file; add or remove while editable */
export default function AttachmentsField({
    orderId,
    files,
    editable,
}: {
    orderId: number;
    files: ImagingAttachmentItem[];
    editable: boolean;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const error = Object.entries(errors).find(([k]) =>
        k.startsWith('files'),
    )?.[1];

    const upload = (list: FileList | null) => {
        if (!list || list.length === 0) return;
        router.post(
            orders.attachments.url(orderId),
            { files: Array.from(list) },
            // Keep what is typed in the report while the file uploads
            { forceFormData: true, preserveScroll: true, preserveState: true },
        );
    };

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">Archivos adjuntos</span>
            {files.length === 0 && !editable && (
                <p className="m-0 text-[13px] text-muted">Sin archivos.</p>
            )}
            {files.map((f) => (
                <div
                    key={f.id}
                    className="flex items-center gap-2 rounded-[10px] border border-card-border px-3 py-2 text-[13.5px]"
                >
                    {f.is_image ? (
                        <FileImage className="h-4 w-4 text-primary" />
                    ) : (
                        <FileText className="h-4 w-4 text-primary" />
                    )}
                    <a
                        href={attachments.show.url(f.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate hover:text-primary hover:underline"
                    >
                        {f.name}
                    </a>
                    <span className="text-[12px] text-muted tabular-nums">
                        {fileSize(f.size)}
                    </span>
                    {editable && (
                        <button
                            type="button"
                            title="Quitar"
                            aria-label={`Quitar ${f.name}`}
                            onClick={() =>
                                router.delete(attachments.destroy.url(f.id), {
                                    preserveScroll: true,
                                    preserveState: true,
                                })
                            }
                            className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-muted hover:bg-error-bg hover:text-error"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ))}
            {editable && (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-input-border px-3 py-3 text-[13.5px] text-text-secondary hover:border-primary hover:text-primary">
                    <Upload className="h-4 w-4" />
                    Adjuntar imágenes o PDF
                    <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.dcm"
                        aria-label="Adjuntar imágenes o PDF"
                        className="sr-only"
                        onChange={(e) => upload(e.target.files)}
                    />
                </label>
            )}
            {error && <p className="m-0 text-[12px] text-error">{error}</p>}
        </div>
    );
}
