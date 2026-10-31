export type ItemKind = 'medicamento' | 'insumo';

export type SupplierCost = {
    name: string;
    last_cost: number;
    last_entry_on: string;
};

export type InventoryItemRow = {
    id: number;
    code: string;
    name: string;
    presentation: string | null;
    kind: ItemKind;
    price: number;
    cost: number | null;
    stock: number;
    min_stock: number;
    is_active: boolean;
    low_stock: boolean;
    lot: string | null;
    /** MM/YYYY */
    expires_on: string | null;
    expires_soon: boolean;
    suppliers: SupplierCost[];
};

export const KIND_LABELS: Record<ItemKind, string> = {
    medicamento: 'Medicamento',
    insumo: 'Insumo',
};

/** «Vencido», «Vence este mes», «Vence en 2 meses» from MM/YYYY */
export function expiryLabel(mmYyyy: string, now = new Date()): string {
    const [m, y] = mmYyyy.split('/').map(Number);
    const months = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
    if (months < 0) return 'Vencido';
    if (months === 0) return 'Vence este mes';
    return `Vence en ${months} ${months === 1 ? 'mes' : 'meses'}`;
}
