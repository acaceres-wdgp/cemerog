import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    FlaskConical,
    Ambulance,
    BedDouble,
    CheckCircle,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import OrderStudiesDialog from '@/components/lab/OrderStudiesDialog';
import type {
    ImagingCatalogItem,
    LabCatalogItem,
} from '@/components/lab/types';
import consulta from '@/routes/consulta';
import AdmitDialog from '@/components/internamiento/AdmitDialog';
import type { AdmissionOptions } from '@/components/internamiento/types';
import AltaMedicaModal from './AltaMedicaModal';
import ToEmergencyDialog, { type FreeCubicle } from './ToEmergencyDialog';
import { TurnItem } from '../types';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
    { key: 'nota', label: 'Nota clínica' },
    { key: 'receta', label: 'Receta' },
    { key: 'cuenta', label: 'Órdenes y cargos' },
];

// ─── Disabled action button with tooltip ──────────────────────────────────────

function DisabledActionButton({
    icon: Icon,
    label,
    tooltip,
}: {
    icon: React.ElementType;
    label: string;
    tooltip: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span tabIndex={0}>
                    <button
                        disabled
                        type="button"
                        aria-label={label}
                        className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-sans text-sm font-medium whitespace-nowrap text-secondary-fg opacity-50"
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
}

// ─── Consulta Actions ─────────────────────────────────────────────────────────

export default function ConsultaActions({
    activeTab,
    setActiveTab,
    turn,
    turnsEnEspera,
    onSelectTurn,
    onDischargeSuccess,
}: {
    activeTab: 'nota' | 'receta' | 'cuenta';
    setActiveTab: (tab: 'nota' | 'receta' | 'cuenta') => void;
    turn: TurnItem;
    turnsEnEspera: TurnItem[];
    onSelectTurn: (t: TurnItem) => void;
    onDischargeSuccess?: () => void;
}) {
    const [ordering, setOrdering] = useState(false);
    const [toEmergency, setToEmergency] = useState(false);
    const [admitting, setAdmitting] = useState(false);
    const pageProps = usePage().props as unknown as {
        lab_catalog?: LabCatalogItem[];
        imaging_catalog?: ImagingCatalogItem[];
        emergency_cubicles?: FreeCubicle[];
        admission_options?: AdmissionOptions | null;
    };
    const labCatalog = pageProps.lab_catalog ?? [];
    const [altaOpen, setAltaOpen] = useState(false);

    const nextTurn = turnsEnEspera[0] ?? null;

    const handleNextPatient = () => {
        if (!nextTurn) return;
        onSelectTurn(nextTurn);
        router.get(
            '/consulta',
            { patient_id: String(nextTurn.patient.id) },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['historial', 'historial_patient'],
            },
        );
    };

    return (
        <TooltipProvider delayDuration={300}>
            {/* Row 1 – action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Left: next patient */}
                {nextTurn ? (
                    <button
                        type="button"
                        onClick={handleNextPatient}
                        aria-label="Cargar próximo paciente"
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-sans text-sm font-medium whitespace-nowrap text-secondary-fg"
                    >
                        <ChevronRight className="h-4 w-4" />
                        T-{String(nextTurn.turn_number).padStart(2, '0')} Cargar
                        próximo paciente
                    </button>
                ) : (
                    <button
                        type="button"
                        disabled
                        aria-label="Sin pacientes en espera"
                        className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-sans text-sm font-medium whitespace-nowrap text-secondary-fg opacity-50"
                    >
                        <ChevronRight className="h-4 w-4" />
                        Sin pacientes en espera
                    </button>
                )}

                {/* Right: disabled + primary */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setOrdering(true)}
                        aria-label="Ordenar estudios"
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-sans text-sm font-medium whitespace-nowrap text-secondary-fg hover:bg-accent-bg"
                    >
                        <FlaskConical className="h-4 w-4" />
                        Ordenar estudios
                    </button>
                    <button
                        type="button"
                        onClick={() => setToEmergency(true)}
                        aria-label="Pasar a emergencia"
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-sans text-sm font-medium whitespace-nowrap text-secondary-fg hover:bg-accent-bg"
                    >
                        <Ambulance className="h-4 w-4" />
                        Pasar a emergencia
                    </button>
                    {pageProps.admission_options ? (
                        <button
                            type="button"
                            onClick={() => setAdmitting(true)}
                            aria-label="Ingresar"
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-sans text-sm font-medium whitespace-nowrap text-secondary-fg hover:bg-accent-bg"
                        >
                            <BedDouble className="h-4 w-4" />
                            Ingresar
                        </button>
                    ) : (
                        <DisabledActionButton
                            icon={BedDouble}
                            label="Ingresar"
                            tooltip="Tu usuario no puede internar pacientes"
                        />
                    )}
                    <button
                        type="button"
                        onClick={() => setAltaOpen(true)}
                        aria-label="Dar alta médica"
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-primary px-[14px] font-sans text-sm font-medium whitespace-nowrap text-white"
                    >
                        <CheckCircle className="h-4 w-4" />
                        Dar alta médica
                    </button>
                </div>
            </div>

            {/* Row 2 – tabs */}
            <div className="inline-flex gap-[2px] rounded-[11px] border border-card-border bg-app-bg p-[3px]">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key as typeof activeTab)}
                        className={cn(
                            'h-[30px] cursor-pointer rounded-[10px] border-0 px-3 font-sans text-sm font-medium whitespace-nowrap',
                            activeTab === t.key
                                ? 'bg-white text-text-heading shadow-[0_1px_3px_rgba(0,0,0,.1)]'
                                : 'bg-transparent text-secondary-fg',
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <OrderStudiesDialog
                open={ordering}
                onOpenChange={setOrdering}
                subtitle={`${turn.patient.full_name} · Turno T-${String(turn.turn_number).padStart(2, '0')}`}
                catalog={labCatalog}
                imagingCatalog={pageProps.imaging_catalog ?? []}
                url={consulta.estudios.store.url(turn.id)}
            />

            <ToEmergencyDialog
                open={toEmergency}
                onOpenChange={setToEmergency}
                subtitle={`${turn.patient.full_name} · Turno T-${String(turn.turn_number).padStart(2, '0')}`}
                cubicles={pageProps.emergency_cubicles ?? []}
                url={consulta.emergencia.url(turn.id)}
            />

            {admitting && pageProps.admission_options && (
                <AdmitDialog
                    open
                    onOpenChange={setAdmitting}
                    options={pageProps.admission_options}
                    patient={turn.patient}
                    turnId={turn.id}
                    subtitle={`${turn.patient.full_name} · Turno T-${String(turn.turn_number).padStart(2, '0')} · desde Consulta`}
                />
            )}

            {/* Alta médica modal */}
            <AltaMedicaModal
                open={altaOpen}
                onOpenChange={setAltaOpen}
                patientName={turn.patient.full_name}
                subtitle={`Turno T-${String(turn.turn_number).padStart(2, '0')}`}
                url={consulta.discharge.url(turn.id)}
                onDischargeSuccess={onDischargeSuccess}
            />
        </TooltipProvider>
    );
}
