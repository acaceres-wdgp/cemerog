import type { ItemKind } from '@/pages/almacen/types';

export type CatalogOption = {
    id: number;
    code: string;
    name: string;
    presentation: string | null;
    kind: ItemKind;
    stock: number;
    cost: number | null;
    price: number;
};

export type NewItem = {
    name: string;
    presentation: string;
    kind: ItemKind;
    price: string;
    min_stock: string;
};

export type EntryLine = {
    key: number;
    itemId: number | null;
    newItem: NewItem | null;
    quantity: string;
    lot: string;
    /** YYYY-MM */
    expires: string;
    cost: string;
};

export type RecentEntry = {
    id: number;
    number: string;
    received_on: string;
    supplier: string;
    lines_count: number;
    total_cost: number;
};

export const itemLabel = (i: { name: string; presentation: string | null }) =>
    i.presentation ? `${i.name} · ${i.presentation}` : i.name;
