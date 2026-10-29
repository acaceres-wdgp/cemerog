import React, { useState } from 'react';
import { router } from '@inertiajs/react';
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
import AltaMedicaModal from './AltaMedicaModal';
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
}: {
    activeTab: 'nota' | 'receta' | 'cuenta';
    setActiveTab: (tab: 'nota' | 'receta' | 'cuenta') => void;
    turn: TurnItem;
    turnsEnEspera: TurnItem[];
    onSelectTurn: (t: TurnItem) => void;
}) {
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
                    <DisabledActionButton
                        icon={FlaskConical}
                        label="Ordenar estudios"
                        tooltip="Disponible cuando se implemente Laboratorio (e Imágenes)"
                    />
                    <DisabledActionButton
                        icon={Ambulance}
                        label="Pasar a emergencia"
                        tooltip="Disponible cuando se implemente Emergencia"
                    />
                    <DisabledActionButton
                        icon={BedDouble}
                        label="Ingresar"
                        tooltip="Disponible cuando se implemente Internamiento"
                    />
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

            {/* Alta médica modal */}
            <AltaMedicaModal
                open={altaOpen}
                onOpenChange={setAltaOpen}
                turn={turn}
            />
        </TooltipProvider>
    );
}
