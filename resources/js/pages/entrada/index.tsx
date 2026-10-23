import { useState } from 'react';

type Item = {
    producto: string;
    cant: number;
    costo: number;
    lote: string;
    vence: string;
};

const INITIAL_ITEMS: Item[] = [
    {
        producto: 'Amoxicilina 500mg cap. (x100)',
        cant: 5,
        costo: 1200,
        lote: 'AMX-2026-10',
        vence: '31/03/2027',
    },
    {
        producto: 'Omeprazol 20mg cap. (x30)',
        cant: 10,
        costo: 450,
        lote: 'OME-2026-09',
        vence: '30/06/2027',
    },
];

const PROVEEDORES = [
    'Farmanova SRL',
    'Distribuidora Medic',
    'Sumedico RD',
    'PharmaPro',
];

const inputStyle: React.CSSProperties = {
    height: 34,
    padding: '0 8px',
    border: '1px solid #e4e4e7',
    borderRadius: 8,
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: 13,
    width: '100%',
};

export default function EntradaIndex() {
    const [proveedor] = useState(PROVEEDORES[0]);
    const [noFactura, setNoFactura] = useState('FAC-2026-0045');
    const [fecha, setFecha] = useState('12/10/2026');
    const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);

    const total = items.reduce((s, i) => s + i.cant * i.costo, 0);
    const fmt = (v: number) =>
        `RD$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    const updateItem = (
        idx: number,
        field: keyof Item,
        value: string | number,
    ) => {
        setItems((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
        );
    };

    const addItem = () =>
        setItems((prev) => [
            ...prev,
            { producto: '', cant: 1, costo: 0, lote: '', vence: '' },
        ]);
    const removeItem = (idx: number) =>
        setItems((prev) => prev.filter((_, i) => i !== idx));

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h1
                    style={{
                        fontFamily: 'Bitter,Georgia,serif',
                        fontWeight: 600,
                        fontSize: 26,
                        color: '#1f2d22',
                        margin: 0,
                    }}
                >
                    Entrada de mercancía
                </h1>
                <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                    Registra la recepción de productos en el almacén
                </p>
            </div>

            {/* Header form */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 14,
                    padding: '16px 20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                    gap: '14px 16px',
                }}
            >
                <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                    <span style={{ fontWeight: 500, fontSize: 14 }}>
                        Proveedor *
                    </span>
                    <div
                        style={{
                            height: 36,
                            padding: '0 12px',
                            border: '1px solid #e4e4e7',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            fontSize: 14,
                        }}
                    >
                        {proveedor} <span>▾</span>
                    </div>
                </div>
                <label
                    style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                    <span style={{ fontWeight: 500, fontSize: 14 }}>
                        No. de factura del proveedor *
                    </span>
                    <input
                        value={noFactura}
                        onChange={(e) => setNoFactura(e.target.value)}
                        style={{
                            height: 36,
                            padding: '0 12px',
                            border: '1px solid #e4e4e7',
                            borderRadius: 10,
                            outline: 'none',
                            fontFamily: 'inherit',
                            fontSize: 14,
                        }}
                    />
                </label>
                <label
                    style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                    <span style={{ fontWeight: 500, fontSize: 14 }}>
                        Fecha de recepción *
                    </span>
                    <input
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        style={{
                            height: 36,
                            padding: '0 12px',
                            border: '1px solid #e4e4e7',
                            borderRadius: 10,
                            outline: 'none',
                            fontFamily: 'inherit',
                            fontSize: 14,
                        }}
                        placeholder="dd/mm/aaaa"
                    />
                </label>
            </div>

            {/* Items table */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 14,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '14px 18px',
                        borderBottom: '1px solid #eef0ec',
                        fontFamily: 'Bitter,Georgia,serif',
                        fontWeight: 600,
                        fontSize: 16,
                        color: '#1f2d22',
                    }}
                >
                    Productos recibidos
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: 800,
                        }}
                    >
                        <thead>
                            <tr>
                                {[
                                    { label: 'Producto', w: '35%' },
                                    { label: 'Cantidad', w: '10%' },
                                    { label: 'Costo unitario', w: '15%' },
                                    { label: 'Total', w: '12%' },
                                    { label: 'No. lote', w: '14%' },
                                    { label: 'Vencimiento', w: '12%' },
                                    { label: '', w: '44px' },
                                ].map((h) => (
                                    <th
                                        key={h.label}
                                        style={{
                                            textAlign:
                                                h.label === 'Cantidad' ||
                                                h.label === 'Costo unitario' ||
                                                h.label === 'Total'
                                                    ? 'right'
                                                    : 'left',
                                            fontWeight: 600,
                                            fontSize: 11.5,
                                            letterSpacing: '.05em',
                                            textTransform: 'uppercase',
                                            color: '#56693f',
                                            padding:
                                                h.label === 'Producto'
                                                    ? '0 18px'
                                                    : '0 10px',
                                            height: 40,
                                            background: '#F6FAF1',
                                            borderBottom: '1px solid #DCEBC9',
                                            whiteSpace: 'nowrap',
                                            width: h.w,
                                        }}
                                    >
                                        {h.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={i}>
                                    <td
                                        style={{
                                            padding: '8px 18px 8px 18px',
                                            borderBottom: '1px solid #eef0ec',
                                            verticalAlign: 'top',
                                        }}
                                    >
                                        <input
                                            value={item.producto}
                                            onChange={(e) =>
                                                updateItem(
                                                    i,
                                                    'producto',
                                                    e.target.value,
                                                )
                                            }
                                            style={inputStyle}
                                            placeholder="Nombre del producto"
                                        />
                                    </td>
                                    <td
                                        style={{
                                            padding: '8px 10px',
                                            borderBottom: '1px solid #eef0ec',
                                            verticalAlign: 'top',
                                        }}
                                    >
                                        <input
                                            type="number"
                                            value={item.cant}
                                            onChange={(e) =>
                                                updateItem(
                                                    i,
                                                    'cant',
                                                    Number(e.target.value),
                                                )
                                            }
                                            style={{
                                                ...inputStyle,
                                                textAlign: 'right',
                                            }}
                                            min={1}
                                        />
                                    </td>
                                    <td
                                        style={{
                                            padding: '8px 10px',
                                            borderBottom: '1px solid #eef0ec',
                                            verticalAlign: 'top',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                height: 34,
                                                border: '1px solid #e4e4e7',
                                                borderRadius: 8,
                                                background: '#fff',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    padding: '0 6px',
                                                    fontSize: 12,
                                                    color: '#71717a',
                                                }}
                                            >
                                                RD$
                                            </span>
                                            <input
                                                type="number"
                                                value={item.costo}
                                                onChange={(e) =>
                                                    updateItem(
                                                        i,
                                                        'costo',
                                                        Number(e.target.value),
                                                    )
                                                }
                                                style={{
                                                    flex: 1,
                                                    height: 32,
                                                    border: 'none',
                                                    outline: 'none',
                                                    background: 'transparent',
                                                    fontFamily: 'inherit',
                                                    fontSize: 13,
                                                    textAlign: 'right',
                                                    padding: '0 8px 0 0',
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td
                                        style={{
                                            padding: '8px 10px',
                                            borderBottom: '1px solid #eef0ec',
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                            fontWeight: 600,
                                            fontSize: 13,
                                            verticalAlign: 'middle',
                                        }}
                                    >
                                        {fmt(item.cant * item.costo)}
                                    </td>
                                    <td
                                        style={{
                                            padding: '8px 10px',
                                            borderBottom: '1px solid #eef0ec',
                                            verticalAlign: 'top',
                                        }}
                                    >
                                        <input
                                            value={item.lote}
                                            onChange={(e) =>
                                                updateItem(
                                                    i,
                                                    'lote',
                                                    e.target.value,
                                                )
                                            }
                                            style={inputStyle}
                                            placeholder="Lote"
                                        />
                                    </td>
                                    <td
                                        style={{
                                            padding: '8px 10px',
                                            borderBottom: '1px solid #eef0ec',
                                            verticalAlign: 'top',
                                        }}
                                    >
                                        <input
                                            value={item.vence}
                                            onChange={(e) =>
                                                updateItem(
                                                    i,
                                                    'vence',
                                                    e.target.value,
                                                )
                                            }
                                            style={inputStyle}
                                            placeholder="dd/mm/aaaa"
                                        />
                                    </td>
                                    <td
                                        style={{
                                            padding: '8px',
                                            borderBottom: '1px solid #eef0ec',
                                            verticalAlign: 'top',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <button
                                            onClick={() => removeItem(i)}
                                            style={{
                                                width: 30,
                                                height: 30,
                                                border: 'none',
                                                borderRadius: 6,
                                                background: 'transparent',
                                                color: '#71717a',
                                                cursor: 'pointer',
                                                fontSize: 14,
                                            }}
                                        >
                                            🗑
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div
                    style={{
                        padding: '10px 18px',
                        borderBottom: '1px solid #eef0ec',
                    }}
                >
                    <button
                        onClick={addItem}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 34,
                            padding: '0 12px',
                            borderRadius: 10,
                            border: '1px dashed #B9DC8E',
                            background: '#F8FBF6',
                            color: '#2E8B3E',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 14,
                        }}
                    >
                        + Agregar producto
                    </button>
                </div>
                <div
                    style={{
                        padding: '14px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#1f2d22',
                        }}
                    >
                        Total del pedido:{' '}
                        <span
                            style={{
                                fontVariantNumeric: 'tabular-nums',
                                color: '#2E8B3E',
                            }}
                        >
                            {fmt(total)}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            style={{
                                height: 36,
                                padding: '0 14px',
                                borderRadius: 10,
                                border: '1px solid #dfe7df',
                                background: '#F6F9F5',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                height: 36,
                                padding: '0 16px',
                                borderRadius: 10,
                                border: 'none',
                                background: '#2E8B3E',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            ✓ Registrar entrada
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
