/**
 * FormDialog – modal dialog with scrollable body and fixed footer for forms.
 */

import { ReactNode, FormEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    submitLabel?: string;
    cancelLabel?: string;
    onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
    isLoading?: boolean;
    footer?: ReactNode;
    maxWidth?: string;
}

export default function FormDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    submitLabel = 'Guardar',
    cancelLabel = 'Cancelar',
    onSubmit,
    isLoading = false,
    footer,
    maxWidth = 'sm:max-w-lg',
}: FormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`flex max-h-[90vh] flex-col p-0 ${maxWidth}`}>
                <DialogHeader className="border-b border-[#e3e9e3] px-6 py-4">
                    <DialogTitle className="text-[#1f2d22]">{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                <form
                    className="flex flex-1 flex-col overflow-hidden"
                    onSubmit={onSubmit}
                >
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {children}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-[#e3e9e3] px-6 py-4">
                        {footer ?? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isLoading}
                                >
                                    {cancelLabel}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{ backgroundColor: '#2E8B3E' }}
                                >
                                    {submitLabel}
                                </Button>
                            </>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
