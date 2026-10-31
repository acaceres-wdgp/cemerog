export type ItemKind = 'medicamento' | 'insumo';

export type InventoryItemRow = {
    id: number;
    code: string;
    name: string;
    presentation: string | null;
    kind: ItemKind;
    price: number;
    stock: number;
    min_stock: number;
    is_active: boolean;
    low_stock: boolean;
};

export const KIND_LABELS: Record<ItemKind, string> = {
    medicamento: 'Medicamento',
    insumo: 'Insumo',
};
