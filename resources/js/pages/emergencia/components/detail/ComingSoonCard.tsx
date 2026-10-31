import React from 'react';
import { Plus } from 'lucide-react';
import { cardCls, headCls, secondaryBtn, titleCls } from './card';

/** A section of the design kept visible but not enabled yet */
export default function ComingSoonCard({
    title,
    action,
    empty,
}: {
    title: string;
    action: string;
    empty: string;
}) {
    return (
        <section className={cardCls}>
            <div className={headCls}>
                <h2 className={titleCls}>{title}</h2>
                <button
                    type="button"
                    disabled
                    title="Disponible próximamente"
                    className={secondaryBtn}
                >
                    <Plus className="h-4 w-4" />
                    {action}
                </button>
            </div>
            <p className="m-0 px-5 py-5 text-center text-[13px] text-muted">
                {empty}{' '}
                <span className="block text-[12px]">
                    Disponible próximamente.
                </span>
            </p>
        </section>
    );
}
