export type Bucket = 'todas' | 'b1' | 'b2' | 'b3' | 'b4';

/** Age of an invoice since it was issued, as in the design */
export const AGES: Record<
    Exclude<Bucket, 'todas'>,
    { label: string; pill: string; dot: string }
> = {
    b1: {
        label: '0 – 30 días',
        pill: 'bg-accent-bg text-accent-fg',
        dot: 'bg-primary',
    },
    b2: {
        label: '31 – 60 días',
        pill: 'state-espera bg-[var(--state-bg)] text-[var(--state-text)]',
        dot: 'state-espera bg-[var(--state-accent)]',
    },
    b3: {
        label: '61 – 90 días',
        pill: 'state-pendiente bg-[var(--state-bg)] text-[var(--state-text)]',
        dot: 'state-pendiente bg-[var(--state-accent)]',
    },
    b4: {
        label: 'Más de 90 días',
        pill: 'state-emergencia bg-[var(--state-bg)] text-[var(--state-text)]',
        dot: 'state-emergencia bg-[var(--state-accent)]',
    },
};

export const bucketOf = (days: number): Exclude<Bucket, 'todas'> =>
    days <= 30 ? 'b1' : days <= 60 ? 'b2' : days <= 90 ? 'b3' : 'b4';

export const invoicesLabel = (n: number) =>
    `${n} ${n === 1 ? 'factura' : 'facturas'}`;
