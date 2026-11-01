import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { UserSearch } from 'lucide-react';
import PatientSearch from '@/components/cemerog/PatientSearch';
import { registro } from '@/routes';

/**
 * «¿El paciente ya está registrado?»: pick an existing patient and reload
 * Registro with their data, keeping the type of attention (`tipo`).
 */
export default function ExistingPatientSearch({
    tipo,
}: {
    tipo: string | undefined;
}) {
    const [query, setQuery] = useState('');

    return (
        <section className="flex flex-wrap items-center gap-3 rounded-[14px] border border-card-border bg-white px-5 py-4">
            <div className="flex items-center gap-2">
                <UserSearch className="h-5 w-5 text-primary" />
                <div>
                    <div className="font-medium text-text-heading">
                        ¿El paciente ya está registrado?
                    </div>
                    <div className="text-[12.5px] text-muted">
                        Búscalo para usar su expediente en vez de crear uno
                        nuevo.
                    </div>
                </div>
            </div>
            <div className="min-w-[280px] flex-1">
                <PatientSearch
                    selected={null}
                    query={query}
                    onQueryChange={setQuery}
                    onSelect={(p) =>
                        router.visit(
                            registro.url({ query: { paciente: p.id, tipo } }),
                        )
                    }
                    onClear={() => setQuery('')}
                    endpoint="/registro/pacientes/buscar"
                    compact
                    placeholder="Buscar por nombre, cédula o expediente…"
                />
            </div>
        </section>
    );
}
