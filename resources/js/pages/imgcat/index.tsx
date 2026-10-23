import { useState } from 'react';

const TIPOS_IMG = [
    'Radiología',
    'Ultrasonido',
    'Tomografía',
    'Resonancia',
    'Mamografía',
    'Endoscopía',
];

const IMGCAT_DATA = [
    {
        id: 1,
        codigo: 'IMG-001',
        nombre: 'Radiografía de tórax PA',
        tipo: 'Radiología',
        precio: 1200,
        prep: 'Sin preparación',
        activo: true,
    },
    {
        id: 2,
        codigo: 'IMG-002',
        nombre: 'Radiografía de columna lumbar AP/lat',
        tipo: 'Radiología',
        precio: 1500,
        prep: 'Sin preparación',
        activo: true,
    },
    {
        id: 3,
        codigo: 'IMG-003',
        nombre: 'Ultrasonido abdominal completo',
        tipo: 'Ultrasonido',
        precio: 2200,
        prep: 'Ayuno 4–6 horas. Vejiga llena.',
        activo: true,
    },
    {
        id: 4,
        codigo: 'IMG-004',
        nombre: 'Ultrasonido pélvico transvaginal',
        tipo: 'Ultrasonido',
        precio: 2400,
        prep: 'Vejiga vacía',
        activo: true,
    },
    {
        id: 5,
        codigo: 'IMG-005',
        nombre: 'Ultrasonido de tiroides',
        tipo: 'Ultrasonido',
        precio: 1900,
        prep: 'Sin preparación',
        activo: true,
    },
    {
        id: 6,
        codigo: 'IMG-006',
        nombre: 'TAC de cráneo simple',
        tipo: 'Tomografía',
        precio: 7500,
        prep: 'Sin preparación',
        activo: true,
    },
    {
        id: 7,
        codigo: 'IMG-007',
        nombre: 'TAC de abdomen y pelvis c/c',
        tipo: 'Tomografía',
        precio: 12000,
        prep: 'Ayuno 6h. Contraindicación creatinina >1.5',
        activo: true,
    },
    {
        id: 8,
        codigo: 'IMG-008',
        nombre: 'Resonancia magnética de columna lumbar',
        tipo: 'Resonancia',
        precio: 18000,
        prep: 'Sin metales. Sin marcapaso.',
        activo: true,
    },
    {
        id: 9,
        codigo: 'IMG-009',
        nombre: 'Mamografía bilateral',
        tipo: 'Mamografía',
        precio: 3500,
        prep: 'No usar desodorante el día del estudio',
        activo: true,
    },
    {
        id: 10,
        codigo: 'IMG-010',
        nombre: 'Endoscopía digestiva alta',
        tipo: 'Endoscopía',
        precio: 9500,
        prep: 'Ayuno de 8 horas',
        activo: false,
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

const fmt = (v: number) =>
    `RD$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ImgcatIndex() {
    const [query, setQuery] = useState('');
    const [tipoFilter, setTipoFilter] = useState('');
    const [editId, setEditId] = useState<number | null>(null);
    const [editPrecio, setEditPrecio] = useState<string>('');
    const [showModal, setShowModal] = useState(false);

    const filtered = IMGCAT_DATA.filter(
        (a) =>
            (!tipoFilter || a.tipo === tipoFilter) &&
            (!query ||
                a.nombre.toLowerCase().includes(query.toLowerCase()) ||
                a.codigo.toLowerCase().includes(query.toLowerCase())),
    );

    const startEdit = (item: (typeof IMGCAT_DATA)[0]) => {
        setEditId(item.id);
        setEditPrecio(item.precio.toString());
    };

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
                        Catálogo de Imágenes
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                        {IMGCAT_DATA.filter((a) => a.activo).length} estudios
                        activos · {TIPOS_IMG.length} modalidades
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
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
                    + Nuevo estudio
                </button>
            </div>

            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 14,
                    overflow: 'hidden',
                }}
            >
                {/* Filters */}
                <div
                    style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #eef0ec',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <div
                        style={{
                            position: 'relative',
                            flex: '0 1 260px',
                            minWidth: 160,
                        }}
                    >
                        <span
                            style={{
                                position: 'absolute',
                                left: 10,
                                top: 10,
                                color: '#71717a',
                                pointerEvents: 'none',
                                fontSize: 13,
                            }}
                        >
                            🔍
                        </span>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar estudio…"
                            style={{
                                height: 36,
                                width: '100%',
                                padding: '0 12px 0 30px',
                                border: '1px solid #e4e4e7',
                                borderRadius: 10,
                                outline: 'none',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setTipoFilter('')}
                            style={{
                                height: 30,
                                padding: '0 10px',
                                borderRadius: 999,
                                border: `1px solid ${!tipoFilter ? '#B9DC8E' : '#e4e4e7'}`,
                                background: !tipoFilter ? '#EEF6E2' : '#fff',
                                color: !tipoFilter ? '#2E8B3E' : '#52525b',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 12,
                                fontWeight: !tipoFilter ? 600 : 400,
                            }}
                        >
                            Todos
                        </button>
                        {TIPOS_IMG.map((t) => (
                            <button
                                key={t}
                                onClick={() =>
                                    setTipoFilter(t === tipoFilter ? '' : t)
                                }
                                style={{
                                    height: 30,
                                    padding: '0 10px',
                                    borderRadius: 999,
                                    border: `1px solid ${tipoFilter === t ? '#B9DC8E' : '#e4e4e7'}`,
                                    background:
                                        tipoFilter === t ? '#EEF6E2' : '#fff',
                                    color:
                                        tipoFilter === t
                                            ? '#2E8B3E'
                                            : '#52525b',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    fontSize: 12,
                                    fontWeight: tipoFilter === t ? 600 : 400,
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            minWidth: 700,
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={thStyle}>Código</th>
                                <th style={thStyle}>Nombre del estudio</th>
                                <th style={thStyle}>Modalidad</th>
                                <th style={thStyle}>Preparación</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>
                                    Precio
                                </th>
                                <th style={thStyle}>Estado</th>
                                <th style={{ ...thStyle, width: 80 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((a) => (
                                <tr
                                    key={a.id}
                                    style={{
                                        opacity: a.activo ? 1 : 0.6,
                                        background: a.activo
                                            ? '#fff'
                                            : '#FAFAFA',
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
                                            color: '#52525b',
                                        }}
                                    >
                                        {a.codigo}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            fontWeight: 500,
                                            fontSize: 14,
                                        }}
                                    >
                                        {a.nombre}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                        }}
                                    >
                                        <span
                                            style={{
                                                padding: '2px 8px',
                                                borderRadius: 999,
                                                background: '#F3F7F2',
                                                fontSize: 12,
                                                color: '#52525b',
                                            }}
                                        >
                                            {a.tipo}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            fontSize: 12.5,
                                            color: '#71717a',
                                            maxWidth: 220,
                                        }}
                                    >
                                        {a.prep}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            textAlign: 'right',
                                        }}
                                    >
                                        {editId === a.id ? (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    gap: 4,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        height: 30,
                                                        border: '1px solid #B9DC8E',
                                                        borderRadius: 8,
                                                        background: '#F8FBF6',
                                                        width: 120,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            padding: '0 6px',
                                                            color: '#71717a',
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        RD$
                                                    </span>
                                                    <input
                                                        autoFocus
                                                        value={editPrecio}
                                                        onChange={(e) =>
                                                            setEditPrecio(
                                                                e.target.value,
                                                            )
                                                        }
                                                        style={{
                                                            flex: 1,
                                                            height: 28,
                                                            border: 'none',
                                                            outline: 'none',
                                                            background:
                                                                'transparent',
                                                            fontFamily:
                                                                'inherit',
                                                            fontSize: 13,
                                                            textAlign: 'right',
                                                            padding:
                                                                '0 6px 0 0',
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        setEditId(null)
                                                    }
                                                    style={{
                                                        height: 30,
                                                        padding: '0 8px',
                                                        borderRadius: 6,
                                                        border: 'none',
                                                        background: '#2E8B3E',
                                                        color: '#fff',
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditId(null)
                                                    }
                                                    style={{
                                                        height: 30,
                                                        padding: '0 8px',
                                                        borderRadius: 6,
                                                        border: '1px solid #dfe7df',
                                                        background: '#fff',
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                        color: '#71717a',
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <span
                                                style={{
                                                    fontVariantNumeric:
                                                        'tabular-nums',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {fmt(a.precio)}
                                            </span>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                        }}
                                    >
                                        <span
                                            style={{
                                                padding: '3px 10px',
                                                borderRadius: 999,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                background: a.activo
                                                    ? '#EEF6E2'
                                                    : '#F4F4F5',
                                                color: a.activo
                                                    ? '#2E8B3E'
                                                    : '#52525B',
                                            }}
                                        >
                                            {a.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid #eef0ec',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <button
                                            onClick={() => startEdit(a)}
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
                                            ✏ Precio
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New study modal */}
            {showModal && (
                <>
                    <div
                        onClick={() => setShowModal(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 40,
                            background: 'rgba(0,0,0,.4)',
                        }}
                    ></div>
                    <div
                        style={{
                            position: 'fixed',
                            zIndex: 41,
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%,-50%)',
                            width: 500,
                            maxWidth: '95vw',
                            background: '#fff',
                            borderRadius: 16,
                            boxShadow: '0 24px 64px -16px rgba(16,40,24,.35)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #eef0ec',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: 'Bitter,Georgia,serif',
                                    fontWeight: 600,
                                    fontSize: 17,
                                    color: '#1f2d22',
                                }}
                            >
                                Nuevo estudio de imagen
                            </span>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    width: 30,
                                    height: 30,
                                    border: 'none',
                                    borderRadius: 8,
                                    background: '#F3F7F2',
                                    cursor: 'pointer',
                                    fontSize: 16,
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <div
                            style={{
                                padding: '16px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 14,
                            }}
                        >
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 12,
                                }}
                            >
                                <label
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                        fontWeight: 500,
                                        fontSize: 14,
                                    }}
                                >
                                    <span>Nombre del estudio *</span>
                                    <input
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
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                        fontWeight: 500,
                                        fontSize: 14,
                                    }}
                                >
                                    <span>Código *</span>
                                    <input
                                        style={{
                                            height: 36,
                                            padding: '0 12px',
                                            border: '1px solid #e4e4e7',
                                            borderRadius: 10,
                                            outline: 'none',
                                            fontFamily:
                                                'ui-monospace,monospace',
                                            fontSize: 13,
                                        }}
                                        placeholder="IMG-000"
                                    />
                                </label>
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 12,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                        fontWeight: 500,
                                        fontSize: 14,
                                    }}
                                >
                                    <span>Modalidad *</span>
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
                                        Radiología <span>▾</span>
                                    </div>
                                </div>
                                <label
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                        fontWeight: 500,
                                        fontSize: 14,
                                    }}
                                >
                                    <span>Precio (RD$) *</span>
                                    <input
                                        type="number"
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
                            </div>
                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    fontWeight: 500,
                                    fontSize: 14,
                                }}
                            >
                                <span>Instrucciones de preparación</span>
                                <textarea
                                    rows={2}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #e4e4e7',
                                        borderRadius: 10,
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        fontSize: 14,
                                        resize: 'none',
                                    }}
                                    placeholder="Ej: Ayuno de 6 horas"
                                />
                            </label>
                        </div>
                        <div
                            style={{
                                padding: '14px 20px',
                                borderTop: '1px solid #eef0ec',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 8,
                            }}
                        >
                            <button
                                onClick={() => setShowModal(false)}
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
                                ✓ Guardar
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
