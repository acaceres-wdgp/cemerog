import { useState } from 'react';

const DOCS = [
    {
        key: 'receta',
        label: 'Receta médica',
        icon: '💊',
        desc: 'Receta con medicamentos, dosis y firma del médico',
    },
    {
        key: 'indicaciones',
        label: 'Indicaciones',
        icon: '📋',
        desc: 'Indicaciones generales del médico al paciente',
    },
    {
        key: 'resultados',
        label: 'Resultados de lab',
        icon: '🧪',
        desc: 'Informe completo de resultados de laboratorio',
    },
    {
        key: 'factura',
        label: 'Factura',
        icon: '🧾',
        desc: 'Factura fiscal con todos los cargos',
    },
    {
        key: 'reposo',
        label: 'Certificado de reposo',
        icon: '🏥',
        desc: 'Certificado médico de reposo laboral',
    },
    {
        key: 'referencia',
        label: 'Carta de referencia',
        icon: '📨',
        desc: 'Carta de referencia a otro especialista',
    },
];

const PRINT_CONTENT: Record<
    string,
    { title: string; content: React.ReactNode }
> = {
    receta: {
        title: 'Receta médica',
        content: (
            <div style={{ fontFamily: 'inherit', fontSize: 13 }}>
                <div
                    style={{
                        borderBottom: '2px solid #1f2d22',
                        paddingBottom: 12,
                        marginBottom: 16,
                    }}
                >
                    <div
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 700,
                            fontSize: 20,
                            color: '#1f2d22',
                        }}
                    >
                        CEMEROG
                    </div>
                    <div style={{ fontSize: 12, color: '#52525b' }}>
                        Centro Médico Dres. Rodríguez & Guzmán · Santo Domingo,
                        RD
                    </div>
                    <div style={{ fontSize: 12, color: '#52525b' }}>
                        Tel: 809-555-0000 · Exequátur: 12345
                    </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                        <div>
                            <span style={{ color: '#71717a' }}>Paciente: </span>
                            <strong>María García</strong>
                        </div>
                        <div>
                            <span style={{ color: '#71717a' }}>Edad: </span>
                            <strong>42 años</strong>
                        </div>
                        <div>
                            <span style={{ color: '#71717a' }}>Fecha: </span>
                            <strong>12/10/2026</strong>
                        </div>
                    </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <div
                        style={{
                            fontWeight: 700,
                            marginBottom: 8,
                            fontSize: 14,
                        }}
                    >
                        Rp.
                    </div>
                    <div
                        style={{
                            paddingLeft: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 600 }}>
                                1. Ciprofloxacino 500 mg
                            </div>
                            <div style={{ color: '#52525b', fontSize: 12 }}>
                                1 tableta vía oral cada 12 horas × 7 días
                            </div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 600 }}>
                                2. Metronidazol 500 mg
                            </div>
                            <div style={{ color: '#52525b', fontSize: 12 }}>
                                1 tableta vía oral cada 8 horas × 5 días
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        fontSize: 12,
                        color: '#52525b',
                        borderTop: '1px solid #e4e4e7',
                        paddingTop: 10,
                    }}
                >
                    Abundantes líquidos. Tratamiento según indicaciones. Volver
                    con resultados en 72 horas.
                </div>
                <div
                    style={{
                        marginTop: 40,
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{
                                width: 160,
                                borderTop: '1px solid #1f2d22',
                                paddingTop: 6,
                                fontSize: 12,
                            }}
                        >
                            <div style={{ fontWeight: 600 }}>
                                Dra. Ana Rodríguez
                            </div>
                            <div style={{ color: '#71717a' }}>
                                Medicina General · Exq. 12345
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
    factura: {
        title: 'Factura',
        content: (
            <div style={{ fontFamily: 'inherit', fontSize: 13 }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '2px solid #1f2d22',
                        paddingBottom: 12,
                        marginBottom: 16,
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontFamily: 'Bitter,Georgia,serif',
                                fontWeight: 700,
                                fontSize: 20,
                                color: '#1f2d22',
                            }}
                        >
                            CEMEROG
                        </div>
                        <div style={{ fontSize: 12, color: '#52525b' }}>
                            RNC: 101-12345-6
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div
                            style={{
                                fontFamily: 'ui-monospace,monospace',
                                fontWeight: 700,
                                fontSize: 16,
                            }}
                        >
                            F-0001234
                        </div>
                        <div style={{ fontSize: 12, color: '#71717a' }}>
                            12/10/2026
                        </div>
                    </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <div>
                        <span style={{ color: '#71717a' }}>Paciente: </span>
                        <strong>María García</strong>
                    </div>
                    <div>
                        <span style={{ color: '#71717a' }}>Cédula: </span>
                        001-0000001-1
                    </div>
                </div>
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: 13,
                        marginBottom: 16,
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                background: '#F6FAF1',
                                borderBottom: '1px solid #DCEBC9',
                            }}
                        >
                            <th
                                style={{
                                    textAlign: 'left',
                                    padding: '6px 8px',
                                    fontWeight: 600,
                                }}
                            >
                                Descripción
                            </th>
                            <th
                                style={{
                                    textAlign: 'right',
                                    padding: '6px 8px',
                                    fontWeight: 600,
                                }}
                            >
                                Importe
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ['Consulta medicina general', 'RD$1,500.00'],
                            ['Uroanálisis', 'RD$600.00'],
                            ['Urocultivo', 'RD$1,200.00'],
                        ].map(([d, i]) => (
                            <tr key={d}>
                                <td
                                    style={{
                                        padding: '6px 8px',
                                        borderBottom: '1px solid #f1f3ef',
                                    }}
                                >
                                    {d}
                                </td>
                                <td
                                    style={{
                                        padding: '6px 8px',
                                        textAlign: 'right',
                                        fontVariantNumeric: 'tabular-nums',
                                        borderBottom: '1px solid #f1f3ef',
                                    }}
                                >
                                    {i}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style={{ padding: '8px', fontWeight: 700 }}>
                                Total
                            </td>
                            <td
                                style={{
                                    padding: '8px',
                                    textAlign: 'right',
                                    fontWeight: 700,
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                RD$3,300.00
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        ),
    },
};

export default function ImpresosIndex() {
    const [selDoc, setSelDoc] = useState<string | null>('receta');
    const printContent = selDoc ? (PRINT_CONTENT[selDoc] ?? null) : null;

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
                    Impresos
                </h1>
                <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                    Selecciona un documento para previsualizar e imprimir
                </p>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 16,
                    alignItems: 'flex-start',
                }}
            >
                {/* Document list */}
                <div
                    style={{
                        flex: '0 0 280px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                    }}
                >
                    {DOCS.map((d) => (
                        <button
                            key={d.key}
                            onClick={() => setSelDoc(d.key)}
                            style={{
                                display: 'flex',
                                gap: 12,
                                alignItems: 'center',
                                padding: '12px 14px',
                                borderRadius: 12,
                                cursor: 'pointer',
                                textAlign: 'left',
                                border: `1.5px solid ${selDoc === d.key ? '#2E8B3E' : '#e3e9e3'}`,
                                background:
                                    selDoc === d.key ? '#EEF6E2' : '#fff',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            <span style={{ fontSize: 22, flexShrink: 0 }}>
                                {d.icon}
                            </span>
                            <div>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        color: '#1f2d22',
                                    }}
                                >
                                    {d.label}
                                </div>
                                <div style={{ fontSize: 12, color: '#71717a' }}>
                                    {d.desc}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Preview */}
                <div style={{ flex: '1 1 500px', minWidth: 0 }}>
                    {printContent ? (
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
                                    padding: '14px 20px',
                                    borderBottom: '1px solid #eef0ec',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: 'Bitter,Georgia,serif',
                                        fontWeight: 600,
                                        fontSize: 16,
                                        color: '#1f2d22',
                                    }}
                                >
                                    Vista previa · {printContent.title}
                                </span>
                                <button
                                    onClick={() => window.print()}
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
                                    🖨 Imprimir
                                </button>
                            </div>
                            <div
                                data-print-area
                                style={{
                                    padding: '40px 48px',
                                    maxWidth: 680,
                                    margin: '0 auto',
                                }}
                            >
                                {printContent.content}
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                background: '#fff',
                                border: '1px dashed #d1d5db',
                                borderRadius: 14,
                                padding: '60px 20px',
                                textAlign: 'center',
                                color: '#71717a',
                            }}
                        >
                            Selecciona un documento para previsualizar
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
