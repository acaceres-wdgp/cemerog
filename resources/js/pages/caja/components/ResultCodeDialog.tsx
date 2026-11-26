import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Printer, RefreshCw } from 'lucide-react';
import type { ResultsAccess } from '@/components/caja/ResultsAccessBox';
import ConfirmDialog from '@/components/cemerog/ConfirmDialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import caja from '@/routes/caja';

/**
 * «Código de resultados» of an invoice with lab or imaging: the current
 * code and its expiry, reprint it, or make a new one (the previous one stops
 * working).
 */
export default function ResultCodeDialog({
    invoiceId,
    code,
    onClose,
}: {
    invoiceId: number;
    code: ResultsAccess | null;
    onClose: () => void;
}) {
    const [confirming, setConfirming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const regenerate = () => {
        setIsLoading(true);
        router.post(
            caja.invoices.resultCode.url(invoiceId),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setConfirming(false),
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <>
            <Dialog open onOpenChange={(o) => !o && onClose()}>
                <DialogContent className="gap-4 sm:max-w-md">
                    <div>
                        <DialogTitle className="font-serif text-[19px] font-semibold text-text-heading">
                            Código de resultados
                        </DialogTitle>
                        <DialogDescription className="text-[13.5px] text-secondary-fg">
                            El paciente lo usa con su fecha de nacimiento en el
                            portal de resultados.
                        </DialogDescription>
                    </div>
                    {code ? (
                        <div className="flex flex-col items-center gap-1 rounded-[12px] border-2 border-primary px-4 py-4">
                            <span className="font-mono text-[24px] font-bold tracking-[.08em] text-primary">
                                {code.code}
                            </span>
                            <span className="text-[13px] text-text-secondary">
                                Vigente hasta el {code.expires_on}
                            </span>
                        </div>
                    ) : (
                        <p className="m-0 rounded-[10px] bg-app-bg px-3 py-[10px] text-[13.5px] text-text-secondary">
                            Esta cuenta no tiene un código vigente. Genera uno
                            nuevo para que el paciente vea sus resultados.
                        </p>
                    )}
                    <div className="flex flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium text-text-body hover:bg-accent-bg"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Generar uno nuevo
                        </button>
                        {code && (
                            <a
                                href={caja.invoices.print.url(invoiceId)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover"
                            >
                                <Printer className="h-4 w-4" />
                                Reimprimir
                            </a>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={confirming}
                onOpenChange={setConfirming}
                title="¿Generar un código nuevo?"
                description={
                    code
                        ? `El código ${code.code} dejará de funcionar. Entrega al paciente la factura reimpresa con el nuevo.`
                        : 'Entrega al paciente la factura reimpresa con el código nuevo.'
                }
                confirmLabel="Generar código nuevo"
                variant="destructive"
                onConfirm={regenerate}
                isLoading={isLoading}
            />
        </>
    );
}
