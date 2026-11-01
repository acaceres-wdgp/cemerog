import React from 'react';
import { FileImage, FileText } from 'lucide-react';
import * as attachments from '@/routes/img/attachments';
import type { ImagingReport } from './types';

/** A signed imaging report: conclusion, findings and files */
export default function ImagingReportBlock({
    report,
}: {
    report: ImagingReport;
}) {
    return (
        <div className="flex flex-col gap-1.5 text-[13px]">
            <div>
                <span className="text-muted">Conclusión: </span>
                <strong className="text-text-heading">
                    {report.conclusion}
                </strong>
            </div>
            {report.findings && (
                <p className="m-0 whitespace-pre-line text-text-secondary">
                    {report.findings}
                </p>
            )}
            {report.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {report.attachments.map((a) => (
                        <a
                            key={a.id}
                            href={attachments.show.url(a.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-white px-2 py-1 text-[12px] hover:text-primary"
                        >
                            {a.is_image ? (
                                <FileImage className="h-3.5 w-3.5" />
                            ) : (
                                <FileText className="h-3.5 w-3.5" />
                            )}
                            {a.name}
                        </a>
                    ))}
                </div>
            )}
            {report.signed_by && (
                <div className="text-[12px] text-muted">
                    Firmado por {report.signed_by} · {report.signed_at}
                </div>
            )}
        </div>
    );
}
