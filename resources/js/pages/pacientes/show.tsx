import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import EmptyState from '@/components/cemerog/EmptyState';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import HistorialPanel from '@/pages/consulta/components/HistorialPanel';
import { pacientes, registro } from '@/routes';
import { show as showPaciente } from '@/routes/pacientes';
import { edit as editPaciente } from '@/routes/registro/pacientes';
import AttentionsList from './components/perfil/AttentionsList';
import FinanzasTab from './components/perfil/FinanzasTab';
import ProfileHeader from './components/perfil/ProfileHeader';
import RecetasTab from './components/perfil/RecetasTab';
import ResumenTab from './components/perfil/ResumenTab';
import type { ProfileProps, ProfileTab } from './components/perfil/types';

export default function PacienteShow(props: ProfileProps) {
    const {
        patient,
        antecedentes,
        stats,
        atenciones,
        historial,
        recetas,
        finanzas,
        can_print,
        tab,
    } = props;
    const permissions =
        (usePage().props as unknown as { permissions?: string[] })
            .permissions ?? [];
    const canRegister = permissions.includes('module.registro.access');

    const setTab = (next: ProfileTab) => {
        router.get(
            showPaciente.url({ patient: patient.id }),
            { tab: next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const segments: { value: ProfileTab; label: string; count?: number }[] = [
        { value: 'resumen', label: 'Resumen' },
        {
            value: 'historial',
            label: 'Historial clínico',
            count: historial.length,
        },
        { value: 'recetas', label: 'Recetas', count: recetas.length },
        { value: 'estudios', label: 'Análisis e imágenes', count: 0 },
        ...(finanzas
            ? [
                  {
                      value: 'finanzas' as const,
                      label: 'Finanzas',
                      count: finanzas.cuentas.length,
                  },
              ]
            : []),
    ];

    const btn =
        'inline-flex h-9 items-center gap-1.5 rounded-lg px-[14px] text-sm font-medium';

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                    href={pacientes.url()}
                    className="inline-flex items-center gap-1 text-[13.5px] font-medium text-muted hover:text-text-heading"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Pacientes
                </Link>
                {canRegister && (
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={editPaciente.url({ patient: patient.id })}
                            className={`${btn} border border-card-border bg-white text-text-body hover:bg-app-bg`}
                        >
                            <Pencil className="h-4 w-4" />
                            Editar datos
                        </Link>
                        <Link
                            href={registro.url({
                                query: { paciente: patient.id },
                            })}
                            className={`${btn} bg-primary text-white hover:bg-primary-hover`}
                        >
                            <Plus className="h-4 w-4" />
                            Nueva atención
                        </Link>
                    </div>
                )}
            </div>

            <ProfileHeader
                patient={patient}
                antecedentes={antecedentes}
                stats={stats}
                finanzas={finanzas}
            />

            <SegmentedControl
                segments={segments}
                value={tab}
                onChange={setTab}
                className="self-start"
            />

            {tab === 'resumen' && (
                <ResumenTab
                    patient={patient}
                    antecedentes={antecedentes}
                    attentions={atenciones.data}
                    finanzas={finanzas}
                    onShowHistory={() => setTab('historial')}
                />
            )}

            {tab === 'historial' && (
                <>
                    <HistorialPanel
                        historial={historial}
                        canPrint={can_print}
                        showFilters={false}
                    />
                    <section className="rounded-2xl border border-card-border bg-white">
                        <h2 className="m-0 border-b border-divider px-5 py-3 font-serif text-[16px] font-semibold text-text-heading">
                            Todas las atenciones
                        </h2>
                        <AttentionsList
                            attentions={atenciones.data}
                            pagination={atenciones}
                        />
                    </section>
                </>
            )}

            {tab === 'recetas' && (
                <RecetasTab recetas={recetas} canPrint={can_print} />
            )}

            {tab === 'estudios' && (
                <div className="rounded-2xl border border-card-border bg-white py-6">
                    <EmptyState
                        title="Sin análisis ni imágenes"
                        description="Disponible cuando se implementen Laboratorio e Imágenes."
                    />
                </div>
            )}

            {tab === 'finanzas' && finanzas && (
                <FinanzasTab finanzas={finanzas} />
            )}
        </div>
    );
}
