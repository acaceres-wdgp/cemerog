import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import type { ClinicInfo } from '@/components/cemerog/ClinicHeader';
import portal from '@/routes/portal';

/**
 * Results portal: public, for patients. Top bar with the logo and a footer
 * with the clinic; none of the staff app (no sidebar).
 */
export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const page = usePage();
    const clinic = (page.props as { clinic?: ClinicInfo }).clinic;
    const inSession = page.component !== 'portal/acceso';

    return (
        <div className="flex min-h-screen flex-col bg-app-bg text-[15px] text-text-body">
            <header className="border-b border-card-border bg-white print:hidden">
                <div className="mx-auto flex max-w-[880px] items-center justify-between gap-3 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-[10px]">
                        <div
                            aria-hidden
                            className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-primary font-serif text-[15px] font-bold text-white"
                        >
                            CG
                        </div>
                        <div className="min-w-0 leading-tight">
                            <div className="font-serif text-[16px] font-semibold text-text-heading">
                                CEMEROG
                            </div>
                            <div className="truncate text-[12.5px] text-text-secondary">
                                Portal de resultados
                            </div>
                        </div>
                    </div>
                    {inSession && (
                        <button
                            type="button"
                            onClick={() => router.post(portal.logout.url())}
                            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border border-secondary-border bg-secondary-bg px-3 text-[14px] font-medium text-text-heading"
                        >
                            <LogOut aria-hidden className="h-4 w-4" />
                            Salir
                        </button>
                    )}
                </div>
            </header>
            <main className="mx-auto w-full max-w-[880px] flex-1 px-5 pt-6 pb-10 print:max-w-none print:p-0">
                {children}
            </main>
            <footer className="px-5 py-4 text-center text-[12.5px] text-text-secondary print:hidden">
                {[clinic?.name, clinic?.address].filter(Boolean).join(' · ')}
            </footer>
        </div>
    );
}
