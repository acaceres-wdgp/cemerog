import { Head, router } from '@inertiajs/react';
import { LockKeyhole } from 'lucide-react';
import EmptyState from '@/components/cemerog/EmptyState';
import { logout } from '@/routes';

/** Landing for users without any module assigned (ADR-026) */
export default function SinModulos() {
    return (
        <>
            <Head title="Sin módulos asignados" />

            <div className="flex min-h-full items-center justify-center p-6">
                <div className="w-full max-w-md rounded-xl border border-card-border bg-white">
                    <EmptyState
                        icon={LockKeyhole}
                        title="No tienes módulos asignados"
                        description="Tu usuario todavía no tiene acceso a ningún módulo. Contacta al administrador para que te asigne un rol o permisos."
                        action={
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => router.post(logout.url())}
                            >
                                Cerrar sesión
                            </button>
                        }
                    />
                </div>
            </div>
        </>
    );
}
