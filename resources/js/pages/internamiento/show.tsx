import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    ChevronLeft,
    LogOut,
    Syringe,
    TriangleAlert,
} from 'lucide-react';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import type { ImagingOrderWithReport } from '@/components/img/types';
import MoveDialog from '@/components/internamiento/MoveDialog';
import type { FreeBed } from '@/components/internamiento/types';
import type {
    ImagingCatalogItem,
    LabCatalogItem,
    LabOrderSummary,
} from '@/components/lab/types';
import { formatMoney } from '@/lib/money';
import { ageLabel } from '@/lib/patient';
import AltaMedicaModal from '@/pages/consulta/components/AltaMedicaModal';
import ApplicationsCard from '@/pages/emergencia/components/detail/ApplicationsCard';
import ApplyDialog from '@/pages/emergencia/components/detail/ApplyDialog';
import LabOrdersCard from '@/pages/emergencia/components/detail/LabOrdersCard';
import VitalsCard from '@/pages/emergencia/components/detail/VitalsCard';
import type {
    Application,
    CatalogItem,
    VitalReading,
} from '@/pages/emergencia/types';
import { internamiento as internamientoMap } from '@/routes';
import internamiento from '@/routes/internamiento';
import ChargesTab from './components/ChargesTab';
import type { StayCharges } from './components/ChargesTab';
import NotesTab from './components/NotesTab';
import type { NursingNote } from './components/NotesTab';

type Tab = 'aplic' | 'estudios' | 'signos' | 'notas' | 'cargos';

type AdmissionDetail = {
    id: number;
    number: string;
    status: 'internado' | 'alta';
    diagnosis: string;
    day: number;
    doctor: string;
    admitted_at: string;
    origin: string;
    treatment: string | null;
    bed_label: string | null;
    room_type: string | null;
    daily_price: number | null;
    discharged_at: string | null;
    patient: {
        id: number;
        full_name: string;
        age: number | null;
        sex: string;
        document_number: string | null;
        expediente_number: string;
        allergies: string | null;
        blood_type: string | null;
    };
};

const btn =
    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium whitespace-nowrap hover:bg-accent-bg';

/** Ficha del paciente internado */
export default function InternamientoShow({
    admission,
    applications = [],
    vitals = [],
    notes = [],
    charges,
    lab_orders = [],
    imaging_orders = [],
    catalog = [],
    routes = [],
    lab_catalog = [],
    imaging_catalog = [],
    free_beds = [],
    can_discharge = false,
    shift = 'mañana',
}: {
    admission: AdmissionDetail;
    applications?: Application[];
    vitals?: VitalReading[];
    notes?: NursingNote[];
    charges: StayCharges;
    lab_orders?: LabOrderSummary[];
    imaging_orders?: ImagingOrderWithReport[];
    catalog?: CatalogItem[];
    routes?: string[];
    lab_catalog?: LabCatalogItem[];
    imaging_catalog?: ImagingCatalogItem[];
    free_beds?: FreeBed[];
    can_discharge?: boolean;
    shift?: string;
}) {
    const [tab, setTab] = useState<Tab>('aplic');
    const [applying, setApplying] = useState(false);
    const [moving, setMoving] = useState(false);
    const [discharging, setDischarging] = useState(false);
    const user = (
        usePage().props.auth as { user?: { name?: string } } | undefined
    )?.user;
    const active = admission.status === 'internado';
    const p = admission.patient;
    const applicationsUrl = internamiento.applications.store.url(admission.id);
    const today = new Date().toLocaleDateString('es-DO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const todayCount = applications.filter((a) => a.date === today).length;
    const charged = applications.reduce((s, a) => s + a.total, 0);
    const studies = lab_orders.length + imaging_orders.length;

    return (
        <div className="flex flex-col gap-4">
            <Link
                href={internamientoMap.url()}
                className="inline-flex items-center gap-1 self-start text-[14px] text-text-secondary hover:text-primary"
            >
                <ChevronLeft className="h-4 w-4" />
                Mapa de habitaciones
            </Link>

            <section className="flex flex-wrap items-start justify-between gap-4 rounded-[14px] border border-card-border bg-white px-5 py-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif text-[20px] font-semibold text-text-heading">
                            {p.full_name}
                        </span>
                        <span
                            className={
                                active
                                    ? 'state-internado rounded-full bg-[var(--state-bg)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--state-text)]'
                                    : 'rounded-full bg-list-row-bg px-2.5 py-0.5 text-[12px] font-medium text-text-secondary'
                            }
                        >
                            {active
                                ? `Internado · Día ${admission.day}`
                                : `Alta ${admission.discharged_at}`}
                        </span>
                    </div>
                    <div className="text-[13px] text-muted">
                        {[
                            admission.number,
                            admission.bed_label,
                            admission.room_type &&
                            admission.daily_price !== null
                                ? `${admission.room_type} · ${formatMoney(admission.daily_price)} / día`
                                : null,
                            `Ingreso ${admission.admitted_at}`,
                            admission.origin,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </div>
                    <div className="mt-1 text-[13.5px]">
                        <strong>{admission.diagnosis}</strong>
                        <span className="text-text-secondary">
                            {' '}
                            · {admission.doctor}
                        </span>
                    </div>
                    <div className="text-[12.5px] text-muted">
                        {[
                            ageLabel(p.age),
                            p.sex === 'F' ? 'Femenino' : 'Masculino',
                            p.expediente_number,
                            p.blood_type,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </div>
                    {p.allergies && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-error-bg px-2.5 py-1 text-[12.5px] text-error-strong">
                            <TriangleAlert className="h-3.5 w-3.5" />
                            Alergias: {p.allergies}
                        </div>
                    )}
                </div>
                {active && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className={btn}
                            onClick={() => setApplying(true)}
                        >
                            <Syringe className="h-4 w-4" />
                            Aplicar medicamento
                        </button>
                        <button
                            type="button"
                            className={btn}
                            onClick={() => setMoving(true)}
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                            Cambiar habitación
                        </button>
                        {can_discharge && (
                            <button
                                type="button"
                                onClick={() => setDischarging(true)}
                                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover"
                            >
                                <LogOut className="h-4 w-4" />
                                Dar alta
                            </button>
                        )}
                    </div>
                )}
            </section>

            {admission.treatment && (
                <section className="rounded-[14px] border border-card-border bg-white px-5 py-3 text-[13.5px]">
                    <span className="font-semibold">
                        Tratamiento e indicaciones:{' '}
                    </span>
                    <span className="whitespace-pre-line text-text-secondary">
                        {admission.treatment}
                    </span>
                </section>
            )}

            <SegmentedControl<Tab>
                segments={[
                    {
                        value: 'aplic',
                        label: 'Medicamentos aplicados',
                        count: applications.length,
                    },
                    {
                        value: 'estudios',
                        label: 'Laboratorio e imágenes',
                        count: studies,
                    },
                    {
                        value: 'signos',
                        label: 'Signos vitales',
                        count: vitals.length,
                    },
                    {
                        value: 'notas',
                        label: 'Notas de enfermería',
                        count: notes.length,
                    },
                    { value: 'cargos', label: 'Cargos acumulados' },
                ]}
                value={tab}
                onChange={setTab}
                className="self-start"
            />

            {tab === 'aplic' && (
                <>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            [
                                'Aplicaciones hoy',
                                String(todayCount),
                                todayCount
                                    ? `Última a las ${applications.filter((a) => a.date === today).at(-1)?.time}`
                                    : 'Ninguna todavía',
                            ],
                            [
                                'Total en la estancia',
                                String(applications.length),
                                'Desde el ingreso',
                            ],
                            [
                                'Cargado a la cuenta',
                                formatMoney(charged),
                                'Medicamentos e insumos',
                            ],
                        ].map(([k, v, sub]) => (
                            <div
                                key={k}
                                className="rounded-[14px] border border-card-border bg-white px-4 py-3"
                            >
                                <div className="text-[12.5px] text-muted">
                                    {k}
                                </div>
                                <div className="font-serif text-[22px] font-bold text-text-heading tabular-nums">
                                    {v}
                                </div>
                                <div className="text-[12px] text-muted">
                                    {sub}
                                </div>
                            </div>
                        ))}
                    </div>
                    {(['medicamento', 'insumo'] as const).map((kind) => (
                        <ApplicationsCard
                            key={kind}
                            emergencyId={admission.id}
                            kind={kind}
                            applications={applications}
                            catalog={catalog}
                            routes={routes}
                            active={active}
                            url={applicationsUrl}
                        />
                    ))}
                </>
            )}
            {tab === 'estudios' && (
                <LabOrdersCard
                    subtitle={`${p.full_name} · ${admission.number}`}
                    orderUrl={internamiento.estudios.store.url(admission.id)}
                    orders={lab_orders}
                    imagingOrders={imaging_orders}
                    catalog={lab_catalog}
                    imagingCatalog={imaging_catalog}
                    active={active}
                />
            )}
            {tab === 'signos' && (
                <VitalsCard
                    emergencyId={admission.id}
                    vitals={vitals}
                    active={active}
                    url={internamiento.vitals.store.url(admission.id)}
                />
            )}
            {tab === 'notas' && (
                <NotesTab
                    admissionId={admission.id}
                    notes={notes}
                    active={active}
                    author={user?.name ?? ''}
                    shift={shift}
                />
            )}
            {tab === 'cargos' && (
                <ChargesTab data={charges} days={admission.day} />
            )}

            {applying && (
                <ApplyDialog
                    emergencyId={admission.id}
                    kind="medicamento"
                    catalog={catalog}
                    routes={routes}
                    url={applicationsUrl}
                    onClose={() => setApplying(false)}
                />
            )}
            {moving && (
                <MoveDialog
                    admissionId={admission.id}
                    patientName={p.full_name}
                    fromLabel={admission.bed_label ?? ''}
                    beds={free_beds}
                    onClose={() => setMoving(false)}
                />
            )}
            {can_discharge && (
                <AltaMedicaModal
                    open={discharging}
                    onOpenChange={setDischarging}
                    patientName={p.full_name}
                    subtitle={`${admission.number} · ${admission.bed_label}. Al confirmar se carga la habitación (${admission.day} ${admission.day === 1 ? 'día' : 'días'}) y la cuenta pasa a Facturación.`}
                    url={internamiento.discharge.url(admission.id)}
                />
            )}
        </div>
    );
}
