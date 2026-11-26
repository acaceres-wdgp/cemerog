import React from 'react';
import { QrCode } from 'lucide-react';
import type { ClinicInfo } from '@/components/cemerog/ClinicHeader';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';

/** «¿Dónde está mi código?»: an example of the invoice with the code box */
export default function CodeHelpDialog({
    open,
    onClose,
    clinic,
}: {
    open: boolean;
    onClose: () => void;
    clinic?: ClinicInfo;
}) {
    const host = typeof window !== 'undefined' ? window.location.host : '';

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[calc(100vh-32px)] w-[460px] max-w-[calc(100vw-32px)] gap-[14px] overflow-y-auto rounded-[18px] p-[22px]">
                <div>
                    <DialogTitle className="font-serif text-[19px] font-semibold text-text-heading">
                        ¿Dónde está mi código?
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 text-[14px] text-secondary-fg">
                        Viene impreso al pie de tu factura de laboratorio o
                        imágenes.
                    </DialogDescription>
                </div>
                <div
                    role="img"
                    aria-label="Ejemplo de factura con el código"
                    className="flex flex-col gap-1 rounded-lg border border-input-border bg-patient-footer-bg px-[18px] py-4 font-mono text-[12px] text-text-dim"
                >
                    <div className="text-center font-bold uppercase">
                        {clinic?.name ?? 'Centro médico'}
                    </div>
                    <div className="text-center">Factura F-0001246</div>
                    <div className="my-1.5 border-t border-dashed border-muted-light" />
                    <div className="flex justify-between">
                        <span>Hemograma completo</span>
                        <span>300.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Radiografía de tórax</span>
                        <span>1,200.00</span>
                    </div>
                    <div className="my-1.5 border-t border-dashed border-muted-light" />
                    <div className="flex items-center gap-3 rounded-lg border-2 border-primary bg-white p-[10px]">
                        <QrCode
                            aria-hidden
                            className="h-16 w-16 flex-none text-text-heading"
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-sans text-[11.5px] text-secondary-fg">
                                Consulta tus resultados en
                            </span>
                            <span className="font-bold text-text-heading">
                                {host}/resultados
                            </span>
                            <span className="mt-0.5 font-sans text-[11.5px] text-secondary-fg">
                                Código:
                            </span>
                            <span className="text-[16px] font-bold tracking-[.08em] text-primary">
                                CMG-7K4P-29XQ
                            </span>
                        </div>
                    </div>
                </div>
                <p className="m-0 text-[13.5px] text-secondary-fg">
                    Si escaneas el código QR con tu celular, el código se llena
                    solo y solo tienes que poner tu fecha de nacimiento. ¿Lo
                    perdiste? Pide uno nuevo en recepción presentando tu cédula.
                </p>
            </DialogContent>
        </Dialog>
    );
}
