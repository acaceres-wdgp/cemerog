import React, { useState } from 'react';
import { thCls } from '../lib/helpers';

// ─── Receta Tab ───────────────────────────────────────────────────────────────

export default function RecetaTab() {
    const [rxRows, setRxRows] = useState([
        { med: '', via: '', dosis: '', frec: '', dias: '' },
    ]);

    return (
        <div className="rounded-[14px] border border-card-border bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-[14px]">
                <div>
                    <div className="font-serif text-[16px] font-semibold text-text-heading">
                        Receta
                    </div>
                    <div className="text-[13px] text-muted">
                        {rxRows.length} medicamentos
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse">
                    <thead>
                        <tr>
                            <th className={`${thCls} w-[34%] pl-[18px]`}>
                                Medicamento
                            </th>
                            <th className={`${thCls} w-[14%]`}>Dosis</th>
                            <th className={`${thCls} w-[22%]`}>Frecuencia</th>
                            <th className={`${thCls} w-[24%]`}>Duración</th>
                            <th className={`${thCls} w-11`}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rxRows.map((m, i) => (
                            <tr key={i}>
                                <td className="border-b border-divider p-2 pl-[18px] align-top">
                                    <div className="flex flex-col gap-[6px]">
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
                                            className="h-[34px] w-full rounded-lg border border-input-border px-[10px] font-sans text-[13.5px] font-medium outline-none"
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
                                            className="h-7 w-full rounded-lg border border-divider px-[10px] font-sans text-[12.5px] text-text-dim outline-none"
                                        />
                                    </div>
                                </td>
                                <td className="border-b border-divider p-2 align-top">
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
                                        className="h-[34px] w-full rounded-lg border border-input-border px-[10px] font-sans text-[13.5px] outline-none"
                                    />
                                </td>
                                <td className="border-b border-divider p-2 align-top">
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
                                        className="h-[34px] w-full rounded-lg border border-input-border px-[10px] font-sans text-[13.5px] outline-none"
                                    />
                                </td>
                                <td className="border-b border-divider p-2 align-top">
                                    <div className="flex h-[34px] items-center rounded-lg border border-input-border bg-white">
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
                                            className="h-8 min-w-0 flex-1 border-0 bg-transparent px-[10px] font-sans text-[13.5px] outline-none"
                                        />
                                        <span className="pr-[10px] text-[12.5px] text-muted">
                                            días
                                        </span>
                                    </div>
                                </td>
                                <td className="border-b border-divider p-2 text-center align-top">
                                    <button
                                        onClick={() =>
                                            setRxRows((r) =>
                                                r.filter((_, j) => j !== i),
                                            )
                                        }
                                        className="h-[34px] w-[34px] cursor-pointer rounded-lg border-0 bg-transparent text-[16px] text-muted"
                                    >
                                        🗑
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="border-b border-divider px-[18px] py-[10px]">
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
                    className="inline-flex h-[34px] cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-accent-border bg-list-row-bg px-3 font-sans text-sm font-semibold text-primary"
                >
                    + Agregar medicamento
                </button>
            </div>
            <div className="flex justify-end border-t border-divider px-[18px] py-3">
                <button className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-primary px-4 font-sans text-sm font-medium text-white">
                    ✓ Guardar receta
                </button>
            </div>
        </div>
    );
}
