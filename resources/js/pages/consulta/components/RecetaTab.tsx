import React, { useState } from 'react';
import { thStyle } from '../lib/helpers';

// ─── Receta Tab ───────────────────────────────────────────────────────────────

export default function RecetaTab() {
    const [rxRows, setRxRows] = useState([
        { med: '', via: '', dosis: '', frec: '', dias: '' },
    ]);

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #e3e9e3',
                borderRadius: 14,
            }}
        >
            <div
                style={{
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 16,
                            color: '#1f2d22',
                        }}
                    >
                        Receta
                    </div>
                    <div
                        style={{
                            fontSize: 13,
                            color: '#71717a',
                        }}
                    >
                        {rxRows.length} medicamentos
                    </div>
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        minWidth: 820,
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                style={{
                                    ...thStyle,
                                    paddingLeft: 18,
                                    width: '34%',
                                }}
                            >
                                Medicamento
                            </th>
                            <th
                                style={{
                                    ...thStyle,
                                    width: '14%',
                                }}
                            >
                                Dosis
                            </th>
                            <th
                                style={{
                                    ...thStyle,
                                    width: '22%',
                                }}
                            >
                                Frecuencia
                            </th>
                            <th
                                style={{
                                    ...thStyle,
                                    width: '24%',
                                }}
                            >
                                Duración
                            </th>
                            <th
                                style={{
                                    ...thStyle,
                                    width: 44,
                                }}
                            ></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rxRows.map((m, i) => (
                            <tr key={i}>
                                <td
                                    style={{
                                        padding: '8px',
                                        borderBottom: '1px solid #eef0ec',
                                        verticalAlign: 'top',
                                        paddingLeft: 18,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 6,
                                        }}
                                    >
                                        <input
                                            value={m.med}
                                            onChange={(e) =>
                                                setRxRows((r) =>
                                                    r.map((row, j) =>
                                                        j === i
                                                            ? {
                                                                  ...row,
                                                                  med: e.target
                                                                      .value,
                                                              }
                                                            : row,
                                                    ),
                                                )
                                            }
                                            placeholder="Medicamento"
                                            style={{
                                                height: 34,
                                                width: '100%',
                                                padding: '0 10px',
                                                border: '1px solid #e4e4e7',
                                                borderRadius: 8,
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: 13.5,
                                                fontWeight: 500,
                                            }}
                                        />
                                        <input
                                            value={m.via}
                                            onChange={(e) =>
                                                setRxRows((r) =>
                                                    r.map((row, j) =>
                                                        j === i
                                                            ? {
                                                                  ...row,
                                                                  via: e.target
                                                                      .value,
                                                              }
                                                            : row,
                                                    ),
                                                )
                                            }
                                            placeholder="Vía"
                                            style={{
                                                height: 28,
                                                width: '100%',
                                                padding: '0 10px',
                                                border: '1px solid #eef0ec',
                                                borderRadius: 8,
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: 12.5,
                                                color: '#52525b',
                                            }}
                                        />
                                    </div>
                                </td>
                                <td
                                    style={{
                                        padding: 8,
                                        borderBottom: '1px solid #eef0ec',
                                        verticalAlign: 'top',
                                    }}
                                >
                                    <input
                                        value={m.dosis}
                                        onChange={(e) =>
                                            setRxRows((r) =>
                                                r.map((row, j) =>
                                                    j === i
                                                        ? {
                                                              ...row,
                                                              dosis: e.target
                                                                  .value,
                                                          }
                                                        : row,
                                                ),
                                            )
                                        }
                                        placeholder="Dosis"
                                        style={{
                                            height: 34,
                                            width: '100%',
                                            padding: '0 10px',
                                            border: '1px solid #e4e4e7',
                                            borderRadius: 8,
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                            fontSize: 13.5,
                                        }}
                                    />
                                </td>
                                <td
                                    style={{
                                        padding: 8,
                                        borderBottom: '1px solid #eef0ec',
                                        verticalAlign: 'top',
                                    }}
                                >
                                    <input
                                        value={m.frec}
                                        onChange={(e) =>
                                            setRxRows((r) =>
                                                r.map((row, j) =>
                                                    j === i
                                                        ? {
                                                              ...row,
                                                              frec: e.target
                                                                  .value,
                                                          }
                                                        : row,
                                                ),
                                            )
                                        }
                                        placeholder="Frecuencia"
                                        style={{
                                            height: 34,
                                            width: '100%',
                                            padding: '0 10px',
                                            border: '1px solid #e4e4e7',
                                            borderRadius: 8,
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                            fontSize: 13.5,
                                        }}
                                    />
                                </td>
                                <td
                                    style={{
                                        padding: 8,
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
                                        <input
                                            value={m.dias}
                                            onChange={(e) =>
                                                setRxRows((r) =>
                                                    r.map((row, j) =>
                                                        j === i
                                                            ? {
                                                                  ...row,
                                                                  dias: e.target
                                                                      .value,
                                                              }
                                                            : row,
                                                    ),
                                                )
                                            }
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                                height: 32,
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                padding: '0 10px',
                                                fontFamily: 'inherit',
                                                fontSize: 13.5,
                                            }}
                                        />
                                        <span
                                            style={{
                                                paddingRight: 10,
                                                fontSize: 12.5,
                                                color: '#71717a',
                                            }}
                                        >
                                            días
                                        </span>
                                    </div>
                                </td>
                                <td
                                    style={{
                                        padding: 8,
                                        borderBottom: '1px solid #eef0ec',
                                        verticalAlign: 'top',
                                        textAlign: 'center',
                                    }}
                                >
                                    <button
                                        onClick={() =>
                                            setRxRows((r) =>
                                                r.filter((_, j) => j !== i),
                                            )
                                        }
                                        style={{
                                            width: 34,
                                            height: 34,
                                            border: 'none',
                                            borderRadius: 8,
                                            background: 'transparent',
                                            color: '#71717a',
                                            cursor: 'pointer',
                                            fontSize: 16,
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
                    onClick={() =>
                        setRxRows((r) => [
                            ...r,
                            {
                                med: '',
                                via: '',
                                dosis: '',
                                frec: '',
                                dias: '',
                            },
                        ])
                    }
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
                    + Agregar medicamento
                </button>
            </div>
            <div
                style={{
                    padding: '12px 18px',
                    borderTop: '1px solid #eef0ec',
                    display: 'flex',
                    justifyContent: 'flex-end',
                }}
            >
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
                    ✓ Guardar receta
                </button>
            </div>
        </div>
    );
}
