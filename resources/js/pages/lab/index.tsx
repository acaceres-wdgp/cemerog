import React from 'react';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { lab } from '@/routes';
import LabHistory from './components/LabHistory';
import LabQueue from './components/LabQueue';
import type { LabHistory as History, LabRow } from './types';

type Props = {
    view?: 'hoy' | 'historial';
    orders?: LabRow[];
    counts?: Record<string, number>;
    history?: History | null;
    tests?: { id: number; name: string }[];
    filters?: { q: string; prueba: number | null; rango: string };
};

/** Laboratorio: cola de hoy e historial */
export default function LabIndex({
    view = 'hoy',
    orders = [],
    counts = {},
    history = null,
    tests = [],
    filters = { q: '', prueba: null, rango: '30' },
}: Props) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <SegmentedControl<'hoy' | 'historial'>
                    segments={[
                        {
                            value: 'hoy',
                            label: 'Hoy',
                            count: orders.filter(
                                (o) => o.status !== 'cancelada',
                            ).length,
                        },
                        { value: 'historial', label: 'Historial' },
                    ]}
                    value={view}
                    onChange={(v) =>
                        router.get(
                            lab.url(
                                v === 'historial'
                                    ? { query: { vista: 'historial' } }
                                    : undefined,
                            ),
                        )
                    }
                />
                <button
                    type="button"
                    disabled
                    title="Disponible próximamente: el paciente que viene solo a análisis se registra en Registro"
                    className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Orden sin consulta
                </button>
            </div>
            {view === 'historial' && history ? (
                <LabHistory history={history} tests={tests} filters={filters} />
            ) : (
                <LabQueue rows={orders} counts={counts} />
            )}
        </div>
    );
}
