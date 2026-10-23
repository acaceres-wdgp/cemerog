/**
 * Component Gallery – only available in local environment (APP_ENV=local).
 * Visit /dev/components to preview all CEMEROG components.
 */

import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Users, Package } from 'lucide-react';
import StatusBadge from '@/components/cemerog/StatusBadge';
import TriageBadge from '@/components/cemerog/TriageBadge';
import StatCard from '@/components/cemerog/StatCard';
import PageHeader from '@/components/cemerog/PageHeader';
import EmptyState from '@/components/cemerog/EmptyState';
import Panel from '@/components/cemerog/Panel';
import AlertBanner from '@/components/cemerog/AlertBanner';
import MoneyText from '@/components/cemerog/MoneyText';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import FilterChips from '@/components/cemerog/FilterChips';
import FormField from '@/components/cemerog/FormField';
import PasswordInput from '@/components/cemerog/PasswordInput';
import VitalsGrid from '@/components/cemerog/VitalsGrid';
import PrintablePage from '@/components/cemerog/PrintablePage';
import ConfirmDialog from '@/components/cemerog/ConfirmDialog';

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mb-12">
            <h2 className="mb-4 border-b border-[#e3e9e3] pb-2 text-lg font-semibold text-[#1f2d22]">
                {title}
            </h2>
            {children}
        </section>
    );
}

export default function ComponentGallery() {
    const [segment, setSegment] = useState<'all' | 'activos' | 'inactivos'>(
        'all',
    );
    const [filterChip, setFilterChip] = useState<string>('todos');
    const [confirmOpen, setConfirmOpen] = useState(false);

    return (
        <>
            <Head title="Galería de componentes" />

            <div className="min-h-screen bg-[#F3F7F2] px-8 py-10">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-10">
                        <h1
                            className="text-3xl font-bold text-[#1f2d22]"
                            style={{ fontFamily: 'Bitter, serif' }}
                        >
                            Galería de componentes
                        </h1>
                        <p className="mt-1 text-sm text-[#71717a]">
                            Solo disponible en entorno local ·{' '}
                            <code className="rounded bg-[#EEF6E2] px-1.5 py-0.5 text-xs text-[#2f4a17]">
                                APP_ENV=local
                            </code>
                        </p>
                    </div>

                    {/* StatusBadge */}
                    <Section title="StatusBadge – Estados de atención">
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    'espera',
                                    'consulta',
                                    'emergencia',
                                    'internado',
                                    'cirugia',
                                    'pendiente',
                                    'balance',
                                    'saldada',
                                    'cancelada',
                                ] as const
                            ).map((s) => (
                                <StatusBadge key={s} state={s} />
                            ))}
                        </div>
                    </Section>

                    {/* TriageBadge */}
                    <Section title="TriageBadge – Niveles de triaje">
                        <div className="flex gap-2">
                            {(['I', 'II', 'III', 'IV', 'V'] as const).map(
                                (l) => (
                                    <TriageBadge key={l} level={l} />
                                ),
                            )}
                        </div>
                    </Section>

                    {/* StatCard */}
                    <Section title="StatCard – Tarjetas de métricas">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <StatCard
                                label="Pacientes hoy"
                                value="48"
                                icon={Users}
                                trend={{ value: 12, label: 'vs ayer' }}
                            />
                            <StatCard
                                label="Ingresos del mes"
                                value="RD$284,500"
                                icon={Package}
                            />
                            <StatCard
                                label="Camas disponibles"
                                value="7 / 12"
                            />
                        </div>
                    </Section>

                    {/* PageHeader */}
                    <Section title="PageHeader">
                        <Panel>
                            <PageHeader
                                title="Registro de pacientes"
                                subtitle="Administra los pacientes registrados en el sistema"
                                actions={
                                    <button className="btn-primary">
                                        Nuevo paciente
                                    </button>
                                }
                            />
                        </Panel>
                    </Section>

                    {/* Panel */}
                    <Section title="Panel">
                        <Panel
                            title="Lista de pacientes"
                            description="Resultados filtrados"
                            headerActions={
                                <button className="btn-secondary text-xs">
                                    Exportar
                                </button>
                            }
                        >
                            <p className="text-sm text-[#71717a]">
                                Contenido del panel aquí.
                            </p>
                        </Panel>
                    </Section>

                    {/* AlertBanner */}
                    <Section title="AlertBanner">
                        <div className="flex flex-col gap-3">
                            <AlertBanner
                                variant="danger"
                                title="Error al guardar"
                            >
                                Verifica los campos marcados en rojo.
                            </AlertBanner>
                            <AlertBanner variant="warning" title="Atención">
                                El paciente tiene alergias registradas.
                            </AlertBanner>
                            <AlertBanner variant="info">
                                Los resultados de laboratorio estarán listos en
                                2 horas.
                            </AlertBanner>
                        </div>
                    </Section>

                    {/* MoneyText */}
                    <Section title="MoneyText – Formato moneda">
                        <div className="flex flex-wrap gap-6">
                            <div>
                                <p className="text-xs text-[#71717a]">
                                    150050 centavos
                                </p>
                                <MoneyText centavos={150050} />
                            </div>
                            <div>
                                <p className="text-xs text-[#71717a]">
                                    -5000 centavos
                                </p>
                                <MoneyText centavos={-5000} colorize />
                            </div>
                            <div>
                                <p className="text-xs text-[#71717a]">
                                    0 centavos
                                </p>
                                <MoneyText centavos={0} />
                            </div>
                        </div>
                    </Section>

                    {/* SegmentedControl */}
                    <Section title="SegmentedControl">
                        <SegmentedControl
                            segments={[
                                { value: 'all', label: 'Todos', count: 48 },
                                {
                                    value: 'activos',
                                    label: 'Activos',
                                    count: 32,
                                },
                                {
                                    value: 'inactivos',
                                    label: 'Inactivos',
                                    count: 16,
                                },
                            ]}
                            value={segment}
                            onChange={setSegment}
                        />
                        <p className="mt-2 text-sm text-[#71717a]">
                            Seleccionado: {segment}
                        </p>
                    </Section>

                    {/* FilterChips */}
                    <Section title="FilterChips">
                        <FilterChips
                            chips={[
                                { value: 'todos', label: 'Todos' },
                                {
                                    value: 'consulta',
                                    label: 'Consulta',
                                    count: 5,
                                },
                                {
                                    value: 'emergencia',
                                    label: 'Emergencia',
                                    count: 2,
                                },
                                {
                                    value: 'lab',
                                    label: 'Laboratorio',
                                    count: 8,
                                },
                            ]}
                            value={filterChip}
                            onChange={(v) => setFilterChip(v as string)}
                        />
                    </Section>

                    {/* FormField */}
                    <Section title="FormField">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                label="Nombre completo"
                                name="name"
                                placeholder="Ej: Juan Pérez"
                                required
                            />
                            <FormField
                                label="Cédula"
                                name="cedula"
                                placeholder="000-0000000-0"
                                error="Cédula inválida."
                            />
                            <FormField
                                label="Notas"
                                name="notes"
                                as="textarea"
                                rows={3}
                                placeholder="Escriba aquí..."
                            />
                            <FormField
                                label="Especialidad"
                                name="especialidad"
                                as="select"
                            >
                                <option value="">Seleccionar...</option>
                                <option>Medicina general</option>
                                <option>Pediatría</option>
                            </FormField>
                        </div>
                    </Section>

                    {/* PasswordInput */}
                    <Section title="PasswordInput">
                        <div className="flex max-w-xs flex-col gap-3">
                            <PasswordInput placeholder="Contraseña" />
                            <PasswordInput
                                placeholder="Con generador"
                                showGenerator
                                onGenerate={(p) => alert(p)}
                            />
                        </div>
                    </Section>

                    {/* EmptyState */}
                    <Section title="EmptyState">
                        <Panel>
                            <EmptyState
                                title="No hay registros"
                                description="Agrega el primer paciente para comenzar."
                                action={
                                    <button className="btn-primary">
                                        Nuevo paciente
                                    </button>
                                }
                            />
                        </Panel>
                    </Section>

                    {/* VitalsGrid */}
                    <Section title="VitalsGrid – Signos vitales">
                        <VitalsGrid
                            vitals={[
                                {
                                    label: 'Frecuencia cardíaca',
                                    value: 72,
                                    unit: 'bpm',
                                    normalRange: [60, 100],
                                    numericValue: 72,
                                },
                                {
                                    label: 'Presión arterial',
                                    value: '120/80',
                                    unit: 'mmHg',
                                },
                                {
                                    label: 'Temperatura',
                                    value: 39.5,
                                    unit: '°C',
                                    normalRange: [36, 37.5],
                                    numericValue: 39.5,
                                },
                                {
                                    label: 'Saturación O₂',
                                    value: 98,
                                    unit: '%',
                                    normalRange: [95, 100],
                                    numericValue: 98,
                                },
                            ]}
                        />
                    </Section>

                    {/* ConfirmDialog */}
                    <Section title="ConfirmDialog">
                        <button
                            className="btn-primary"
                            onClick={() => setConfirmOpen(true)}
                        >
                            Abrir diálogo de confirmación
                        </button>
                        <ConfirmDialog
                            open={confirmOpen}
                            onOpenChange={setConfirmOpen}
                            title="¿Eliminar paciente?"
                            description="Esta acción no se puede deshacer. El registro será eliminado permanentemente."
                            confirmLabel="Eliminar"
                            variant="destructive"
                            onConfirm={() => {
                                alert('Confirmado');
                                setConfirmOpen(false);
                            }}
                        />
                    </Section>

                    {/* PrintablePage preview */}
                    <Section title="PrintablePage">
                        <div className="overflow-hidden rounded-lg border border-[#e3e9e3]">
                            <PrintablePage
                                title="Recibo de consulta"
                                className="text-sm shadow-none"
                            >
                                <p className="text-[#333333]">
                                    Contenido del documento imprimible.
                                </p>
                            </PrintablePage>
                        </div>
                    </Section>
                </div>
            </div>
        </>
    );
}
