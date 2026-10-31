import React, { useState } from 'react';
import { BedDouble, ChevronRight, LogOut, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import AltaMedicaModal from '@/pages/consulta/components/AltaMedicaModal';
import emergenciaRoutes from '@/routes/emergencia';
import type { EmergencyDetail } from '../../types';
import { cardCls, headCls, titleCls } from './card';

type Option = {
    label: string;
    desc: string;
    icon: React.ElementType;
    tone: string;
    enabled: boolean;
    onClick?: () => void;
};

/** Salida del paciente: only the discharge is enabled for now */
export default function ExitCard({
    emergency,
    canDischarge,
}: {
    emergency: EmergencyDetail;
    canDischarge: boolean;
}) {
    const [discharging, setDischarging] = useState(false);

    const options: Option[] = [
        {
            label: 'Internar',
            desc: 'Disponible cuando esté listo Internamiento',
            icon: BedDouble,
            tone: 'state-internado',
            enabled: false,
        },
        {
            label: 'Ingreso para cirugía',
            desc: 'Disponible cuando esté listo Cirugía',
            icon: Scissors,
            tone: 'state-cirugia',
            enabled: false,
        },
        {
            label: 'Dar alta',
            desc: canDischarge
                ? 'Por alivio, traslado a otro centro o defunción'
                : 'Solo un médico o un administrador puede dar el alta',
            icon: LogOut,
            tone: 'state-saldada',
            enabled: canDischarge,
            onClick: () => setDischarging(true),
        },
    ];

    return (
        <section className={cardCls}>
            <div className={headCls}>
                <div>
                    <h2 className={titleCls}>Salida del paciente</h2>
                    <div className="text-[13px] text-muted">
                        ¿Qué sigue para esta atención?
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-2 px-5 py-4">
                {options.map((o) => (
                    <button
                        key={o.label}
                        type="button"
                        disabled={!o.enabled}
                        onClick={o.onClick}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-[12px] border border-card-border bg-white px-3 py-2.5 text-left',
                            o.enabled
                                ? 'cursor-pointer hover:bg-list-row-bg'
                                : 'cursor-not-allowed opacity-55',
                        )}
                    >
                        <span
                            className={cn(
                                'inline-flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-[var(--state-bg)] text-[var(--state-text)]',
                                o.tone === 'state-saldada'
                                    ? 'bg-accent-bg text-primary'
                                    : o.tone,
                            )}
                        >
                            <o.icon className="h-[18px] w-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-text-heading">
                                {o.label}
                            </span>
                            <span className="block text-[12.5px] text-muted">
                                {o.desc}
                            </span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted" />
                    </button>
                ))}
            </div>
            {canDischarge && (
                <AltaMedicaModal
                    open={discharging}
                    onOpenChange={setDischarging}
                    patientName={emergency.patient.full_name}
                    subtitle={`${emergency.number} · ${emergency.cubicle.name}. Al confirmar, la atención pasa a Caja para facturar.`}
                    url={emergenciaRoutes.discharge.url(emergency.id)}
                />
            )}
        </section>
    );
}
