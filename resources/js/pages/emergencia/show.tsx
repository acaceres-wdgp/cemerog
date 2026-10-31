import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { emergencia } from '@/routes';
import { formatMoney } from '@/lib/money';
import ApplicationsCard from './components/detail/ApplicationsCard';
import ComingSoonCard from './components/detail/ComingSoonCard';
import PatientCard from './components/detail/PatientCard';
import VitalsCard from './components/detail/VitalsCard';
import useNow from './components/useNow';
import type {
    Application,
    CatalogItem,
    EmergencyDetail,
    VitalReading,
} from './types';
import { elapsed } from './types';

type Props = {
    emergency: EmergencyDetail;
    vitals: VitalReading[];
    applications: Application[];
    catalog: CatalogItem[];
    routes: string[];
};

export default function EmergenciaShow({
    emergency,
    vitals,
    applications,
    catalog,
    routes,
}: Props) {
    const active = emergency.status === 'activa';
    const now = useNow();
    const { account } = emergency;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-card-border bg-white px-5 py-4">
                <div className="min-w-0 flex-1">
                    <div className="font-serif text-[20px] font-semibold text-text-heading">
                        {emergency.patient.full_name}
                    </div>
                    <div className="text-[13px] text-muted">
                        {emergency.number} · {emergency.cubicle.name} · Llegada{' '}
                        {emergency.arrived_on} · {emergency.doctor}
                    </div>
                </div>
                <span className="state-emergencia rounded-full bg-[var(--state-bg)] px-3 py-1 text-[13px] text-[var(--state-text)]">
                    En emergencia hace{' '}
                    <strong>{elapsed(emergency.arrived_at, now)}</strong>
                </span>
                <Link
                    href={emergencia.url()}
                    className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-secondary-border bg-secondary-bg px-3 font-medium text-text-body hover:bg-accent-bg"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Tablero
                </Link>
            </div>
            <div className="flex flex-wrap items-start gap-4">
                <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
                    <VitalsCard
                        emergencyId={emergency.id}
                        vitals={vitals}
                        active={active}
                    />
                    {(['medicamento', 'insumo'] as const).map((kind) => (
                        <ApplicationsCard
                            key={kind}
                            emergencyId={emergency.id}
                            kind={kind}
                            applications={applications}
                            catalog={catalog}
                            routes={routes}
                            active={active}
                        />
                    ))}
                    <ComingSoonCard
                        title="Procedimientos"
                        action="Agregar procedimiento"
                        empty="Sin procedimientos registrados."
                    />
                </div>
                <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
                    <PatientCard emergency={emergency} />
                    <ComingSoonCard
                        title="Laboratorio e imágenes"
                        action="Ordenar"
                        empty="Sin estudios ordenados."
                    />
                    <section className="rounded-[14px] border border-card-border bg-white px-5 py-4">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold">
                                Cuenta de la atención
                            </span>
                            <span className="font-serif text-[20px] font-bold text-text-heading tabular-nums">
                                {formatMoney(account.total)}
                            </span>
                        </div>
                        <div className="text-[13px] text-muted">
                            {account.charges_count}{' '}
                            {account.charges_count === 1 ? 'cargo' : 'cargos'} ·
                            se factura al dar el alta
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
