import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { LAB_STATUS } from '@/components/lab/types';
import * as orders from '@/routes/lab/orders';
import type { LabRow } from '../types';

const btn =
    'inline-flex h-8 cursor-pointer items-center rounded-[10px] border border-secondary-border bg-secondary-bg px-3 text-[13px] font-medium whitespace-nowrap text-text-body hover:bg-accent-bg';
const iconBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-white text-text-secondary hover:bg-app-bg';

/** Next step of an order (as in the design) and print */
export default function QuickAction({ order }: { order: LabRow }) {
    const stop = (e: React.MouseEvent) => e.stopPropagation();
    const post = (url: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(url, {}, { preserveScroll: true });
    };
    const early = order.status === 'ordenada' || order.status === 'muestra';

    return (
        <div className="flex justify-end gap-1.5">
            {order.status === 'ordenada' && (
                <button
                    type="button"
                    onClick={post(orders.sample.url(order.id))}
                    className={btn}
                >
                    {LAB_STATUS.ordenada.next}
                </button>
            )}
            {order.status === 'validada' && (
                <button
                    type="button"
                    onClick={post(orders.deliver.url(order.id))}
                    className={btn}
                >
                    {LAB_STATUS.validada.next}
                </button>
            )}
            {['muestra', 'ingresado', 'entregada'].includes(order.status) && (
                <Link
                    href={orders.show.url(order.id)}
                    onClick={stop}
                    className={btn}
                >
                    {LAB_STATUS[order.status].next}
                </Link>
            )}
            {order.status !== 'cancelada' && (
                <a
                    href={orders.print.url(order.id)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={stop}
                    title={early ? 'Imprimir indicación' : 'Imprimir resultado'}
                    aria-label={
                        early ? 'Imprimir indicación' : 'Imprimir resultado'
                    }
                    className={iconBtn}
                >
                    <Printer className="h-4 w-4" />
                </a>
            )}
        </div>
    );
}
