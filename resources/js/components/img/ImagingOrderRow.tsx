import React from 'react';
import ImagingReportBlock from './ImagingReportBlock';
import ImgStatusPill from './ImgStatusPill';
import type { ImagingOrderWithReport } from './types';

/** An imaging order in Consulta or Emergencia, with its report when signed */
export default function ImagingOrderRow({
    order,
    onCancel,
    className = 'border-t border-divider px-[18px] py-3',
}: {
    order: ImagingOrderWithReport;
    onCancel?: () => void;
    className?: string;
}) {
    return (
        <div className={className}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="font-medium text-text-heading">
                        {order.name}
                    </div>
                    <div className="text-[12.5px] text-muted">
                        Imágenes · {order.number} · {order.ordered_time}
                    </div>
                </div>
                <div className="flex flex-none flex-col items-end gap-1">
                    <ImgStatusPill status={order.status} />
                    {order.status === 'ordenada' && onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="cursor-pointer text-[12px] font-semibold text-error"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>
            {order.report && (
                <div className="mt-2 rounded-[10px] bg-list-row-bg px-3 py-2">
                    <ImagingReportBlock report={order.report} />
                </div>
            )}
        </div>
    );
}
