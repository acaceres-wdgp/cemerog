import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { entrada } from '@/routes';

const PRODUCTOS = [
    {
        code: 'MED-001',
        nombre: 'Amoxicilina 500mg cap.',
        cat: 'Antibióticos',
        stock: 45,
        min: 20,
        precio: 'RD$28.00',
        vence: '31/03/2027',
        bajo: false,
        proxVence: false,
    },
    {
        code: 'MED-002',
        nombre: 'Metformina 850mg tab.',
        cat: 'Antidiabéticos',
        stock: 8,
        min: 30,
        precio: 'RD$12.00',
        vence: '28/02/2027',
        bajo: true,
        proxVence: false,
    },
    {
        code: 'MED-003',
        nombre: 'Ibuprofeno 400mg tab.',
        cat: 'Analgésicos',
        stock: 120,
        min: 50,
        precio: 'RD$8.00',
        vence: '30/11/2026',
        bajo: false,
        proxVence: true,
    },
    {
        code: 'SUP-001',
        nombre: 'Guantes nitrilo M (caja)',
        cat: 'Suministros',
        stock: 3,
        min: 10,
        precio: 'RD$480.00',
        vence: '—',
        bajo: true,
        proxVence: false,
    },
    {
        code: 'MED-004',
        nombre: 'Omeprazol 20mg cap.',
        cat: 'Gastro',
        stock: 200,
        min: 40,
        precio: 'RD$9.50',
        vence: '30/06/2027',
        bajo: false,
        proxVence: false,
    },
    {
        code: 'MED-005',
        nombre: 'Losartán 50mg tab.',
        cat: 'Antihipertensivos',
        stock: 55,
        min: 30,
        precio: 'RD$22.00',
        vence: '31/01/2027',
        bajo: false,
        proxVence: false,
    },
    {
        code: 'SUP-002',
        nombre: 'Jeringas 5ml (caja x50)',
        cat: 'Suministros',
        stock: 2,
        min: 5,
        precio: 'RD$320.00',
        vence: '—',
        bajo: true,
        proxVence: false,
    },
];

const thStyle: React.CSSProperties = {
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 11.5,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    color: '#56693f',
    padding: '0 12px',
    height: 40,
    background: '#F6FAF1',
    borderBottom: '1px solid #DCEBC9',
    whiteSpace: 'nowrap',
};

export default function AlmacenIndex() {
    const [query, setQuery] = useState('');
    const lowStock = PRODUCTOS.filter((p) => p.bajo);
    const proxVence = PRODUCTOS.filter((p) => p.proxVence);

    const filtered = PRODUCTOS.filter(
        (p) =>
            !query ||
            p.nombre.toLowerCase().includes(query.toLowerCase()) ||
            p.code.toLowerCase().includes(query.toLowerCase()) ||
            p.cat.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <div className="flex flex-col gap-5">
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                }}
            >
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
                        Almacén
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                        {PRODUCTOS.length} productos · {lowStock.length} con
                        stock bajo
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link
                        href={entrada()}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 36,
                            padding: '0 14px',
                            borderRadius: 10,
                            border: '1px solid #dfe7df',
                            background: '#F6F9F5',
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 14,
                            color: '#333',
                            textDecoration: 'none',
                        }}
                    >
                        📦 Nueva entrada
                    </Link>
                    <button
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 36,
                            padding: '0 14px',
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
                        + Nuevo producto
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {lowStock.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#b91c1c',
                    }}
                >
                    <span style={{ fontSize: 18 }}>⚠</span>
                    <div>
                        <div style={{ fontWeight: 600 }}>
                            Stock bajo en {lowStock.length} productos
                        </div>
                        <div style={{ fontSize: 13 }}>
                            {lowStock.map((p) => p.nombre).join(', ')}
                        </div>
                    </div>
                </div>
            )}
            {proxVence.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: '1px solid #fcd34d',
                        background: '#FFFBEB',
                        color: '#92400E',
                    }}
                >
                    <span style={{ fontSize: 18 }}>⏰</span>
                    <div>
                        <div style={{ fontWeight: 600 }}>
                            Vencimiento próximo en {proxVence.length} productos
                        </div>
                        <div style={{ fontSize: 13 }}>
                            {proxVence
                                .map((p) => `${p.nombre} (${p.vence})`)
                                .join(', ')}
                        </div>
                    </div>
                </div>
            )}

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
                        padding: '12px 16px',
                        borderBottom: '1px solid #eef0ec',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            flex: '0 1 300px',
                            minWidth: 200,
                        }}
                    >
                        <span
                            style={{
                                position: 'absolute',
                                left: 10,
                                top: 10,
                                color: '#71717a',
                                pointerEvents: 'none',
                            }}
                        >
                            🔍
                        </span>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre, código o categoría…"
                            style={{
                                height: 36,
                                width: '100%',
                                padding: '0 12px 0 32px',
                                border: '1px solid #e4e4e7',
                                borderRadius: 10,
                                outline: 'none',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        />
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: 720,
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={thStyle}>Código</th>
                                <th style={thStyle}>Nombre</th>
                                <th style={thStyle}>Categoría</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>
                                    Stock
                                </th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>
                                    Mínimo
                                </th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>
                                    Precio
                                </th>
                                <th style={thStyle}>Vencimiento</th>
                                <th style={{ ...thStyle, width: 44 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr
                                    key={p.code}
                                    style={{
                                        background: p.bajo ? '#FEF5F5' : '#fff',
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            fontFamily:
                                                'ui-monospace,monospace',
                                            fontSize: 12,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {p.code}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {p.nombre}
                                        {p.bajo && (
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    marginLeft: 6,
                                                    padding: '1px 7px',
                                                    borderRadius: 999,
                                                    background: '#fef2f2',
                                                    color: '#b91c1c',
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Stock bajo
                                            </span>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            fontSize: 13,
                                            color: '#52525b',
                                        }}
                                    >
                                        <span
                                            style={{
                                                padding: '2px 8px',
                                                borderRadius: 999,
                                                background: '#F3F7F2',
                                                fontSize: 12,
                                            }}
                                        >
                                            {p.cat}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            textAlign: 'right',
                                            fontWeight: 700,
                                            fontVariantNumeric: 'tabular-nums',
                                            color: p.bajo
                                                ? '#b91c1c'
                                                : '#1f2d22',
                                        }}
                                    >
                                        {p.stock}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                            color: '#71717a',
                                        }}
                                    >
                                        {p.min}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {p.precio}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            fontVariantNumeric: 'tabular-nums',
                                            color: p.proxVence
                                                ? '#92400E'
                                                : '#1f2d22',
                                            fontWeight: p.proxVence ? 600 : 400,
                                        }}
                                    >
                                        {p.vence}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            color: '#a1a1aa',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <button
                                            style={{
                                                height: 28,
                                                padding: '0 8px',
                                                borderRadius: 6,
                                                border: '1px solid #dfe7df',
                                                background: '#F6F9F5',
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                fontFamily: 'inherit',
                                            }}
                                        >
                                            ✏
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
