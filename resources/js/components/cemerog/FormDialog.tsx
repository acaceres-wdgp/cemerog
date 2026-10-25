/**
 * FormDialog – modal dialog with scrollable body and fixed footer for forms.
 *
 * Composed from Radix Dialog primitives to apply CEMEROG design tokens
 * (overlay, card background, radius) instead of shadcn's defaults.
 */

import { ReactNode, FormEvent } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
    Dialog,
    DialogPortal,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
            <DialogPortal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    className={cn(
                        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                        'fixed top-[50%] left-[50%] z-50 flex max-h-[90vh] w-full translate-x-[-50%] translate-y-[-50%] flex-col duration-200',
                        'rounded-[14px] border border-card-border bg-card-bg',
                        'shadow-[0_24px_64px_-16px_rgba(16,40,24,.35)]',
                        maxWidth,
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
                        <div>
                            <DialogTitle className="text-base font-semibold text-text-heading">
                                {title}
                            </DialogTitle>
                            {description && (
                                <DialogDescription className="mt-0.5 text-[13px] text-muted">
                                    {description}
                                </DialogDescription>
                            )}
                        </div>
                        <DialogPrimitive.Close
                            className="inline-flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-app-bg text-sm text-text-heading outline-none hover:bg-secondary-bg"
                            aria-label="Cerrar"
                        >
                            ✕
                        </DialogPrimitive.Close>
                    </div>

                    <form
                        className="flex flex-1 flex-col overflow-hidden"
                        onSubmit={onSubmit}
                    >
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {children}
                        </div>

                        <div className="flex justify-end gap-2 border-t border-card-border px-5 py-4">
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
                                        className="bg-primary text-primary-foreground"
                                    >
                                        {submitLabel}
                                    </Button>
                                </>
                            )}
                        </div>
                    </form>
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
