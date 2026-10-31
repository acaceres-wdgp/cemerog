import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import emergenciaRoutes from '@/routes/emergencia';
import CubicleMap from './components/CubicleMap';
import EmergencyTable from './components/EmergencyTable';
import useNow from './components/useNow';
import type { CubicleCell, EmergencyRow } from './types';
import { elapsed } from './types';

export default function EmergenciaIndex({
    emergencies = [],
    cubicles = [],
}: {
    emergencies?: EmergencyRow[];
    cubicles?: CubicleCell[];
}) {
    const now = useNow();
    const [cubicle, setCubicle] = useState('todos');

    const rows = useMemo(
        () =>
            cubicle === 'todos'
                ? emergencies
                : emergencies.filter((e) => String(e.cubicle.id) === cubicle),
        [emergencies, cubicle],
    );
    const free = cubicles.filter((c) => c.emergency_id === null).length;
    const average =
        emergencies.length === 0
            ? null
            : new Date(
                  now -
                      emergencies.reduce(
                          (sum, e) =>
                              sum + (now - new Date(e.arrived_at).getTime()),
                          0,
                      ) /
                          emergencies.length,
              ).toISOString();

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-text-secondary">
                    {emergencies.length}{' '}
                    {emergencies.length === 1 ? 'paciente' : 'pacientes'} en
                    emergencia · {free}{' '}
                    {free === 1 ? 'cubículo libre' : 'cubículos libres'}
                    {average && ` · tiempo promedio ${elapsed(average, now)}`}
                </p>
                <Link
                    href={emergenciaRoutes.ingreso.url()}
                    className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover"
                >
                    <Plus className="h-4 w-4" />
                    Ingreso rápido
                </Link>
            </div>
            <CubicleMap cubicles={cubicles} />
            <section className="overflow-x-auto rounded-[14px] border border-card-border bg-white shadow-[0_1px_2px_rgba(16,40,24,.03)]">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <label className="flex items-center gap-2 text-[13px] text-muted">
                        Cubículo
                        <select
                            aria-label="Filtrar por cubículo"
                            value={cubicle}
                            onChange={(e) => setCubicle(e.target.value)}
                            className="h-9 rounded-[10px] border border-input-border bg-white px-3 text-[14px] text-text-body outline-none focus:border-primary"
                        >
                            <option value="todos">Todos</option>
                            {cubicles.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <span className="text-[13px] text-muted">
                        {rows.length}{' '}
                        {rows.length === 1 ? 'paciente' : 'pacientes'}
                    </span>
                </div>
                <EmergencyTable rows={rows} now={now} />
                {rows.length === 0 && (
                    <div className="p-8 text-center text-muted">
                        {emergencies.length === 0
                            ? 'No hay pacientes en emergencia.'
                            : 'No hay pacientes en ese cubículo.'}
                    </div>
                )}
            </section>
        </div>
    );
}
