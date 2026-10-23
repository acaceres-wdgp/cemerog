import { useState } from 'react';
import StatusBadge from '@/components/cemerog/StatusBadge';

const PATIENT = {
    ini: 'MG',
    name: 'María García',
    edad: '42 años',
    sexo: 'Femenino',
    ced: '001-0000001-1',
    no: 'A-MG01-000234',
    area: 'Consulta',
    medico: 'Dra. Ana Rodríguez',
    ingreso: '09:15',
    alergia: 'Penicilina',
};

const VITALS = [
    { k: 'Presión arterial', v: '120/80', ph: '120/80', u: 'mmHg', out: false },
    { k: 'Frec. cardíaca', v: '82', ph: '80', u: 'lpm', out: false },
    { k: 'Frec. respiratoria', v: '16', ph: '16', u: 'rpm', out: false },
    { k: 'Temperatura', v: '37.2', ph: '36.8', u: '°C', out: false },
    { k: 'SpO₂', v: '98', ph: '98', u: '%', out: false },
    { k: 'Glucemia', v: '—', ph: '—', u: 'mg/dL', out: false },
    { k: 'Peso', v: '68', ph: '70', u: 'kg', out: false },
    { k: 'Talla', v: '165', ph: '160', u: 'cm', out: false },
];

const MOCK_HISTORY = [
    {
        id: 1,
        area: 'Consulta',
        f: '05/10/2026',
        tit: 'Infección vías urinarias',
        med: 'Dra. Ana Rodríguez',
        esp: 'Med. general',
        bar: '#2563EB',
        tbg: '#DBEAFE',
        tfg: '#1E40AF',
        dx: 'N39.0 – Infección de vías urinarias',
    },
    {
        id: 2,
        area: 'Lab',
        f: '05/10/2026',
        tit: 'Uroanálisis + Urocultivo',
        med: 'Dra. Ana Rodríguez',
        esp: 'Med. general',
        bar: '#8CC63F',
        tbg: '#EEF6E2',
        tfg: '#2E8B3E',
        dx: null,
    },
    {
        id: 3,
        area: 'Consulta',
        f: '12/09/2026',
        tit: 'Control hipertensión',
        med: 'Dr. Pedro Guzmán',
        esp: 'Cardiología',
        bar: '#2563EB',
        tbg: '#DBEAFE',
        tfg: '#1E40AF',
        dx: 'I10 – Hipertensión esencial',
    },
];

const MOCK_RX = [
    {
        med: 'Ciprofloxacino 500 mg',
        via: 'Vía oral',
        dosis: '1 tableta',
        frec: 'Cada 12 horas',
        dias: '7',
        cont: false,
    },
    {
        med: 'Metronidazol 500 mg',
        via: 'Vía oral',
        dosis: '1 tableta',
        frec: 'Cada 8 horas',
        dias: '5',
        cont: false,
    },
];

const MOCK_CARGOS = [
    { desc: 'Consulta medicina general', cant: 1, imp: 'RD$1,500.00' },
    { desc: 'Uroanálisis', cant: 1, imp: 'RD$600.00' },
    { desc: 'Urocultivo', cant: 1, imp: 'RD$1,200.00' },
];

const ORDENES = [
    {
        est: 'Uroanálisis',
        serv: 'Laboratorio',
        estado: 'Pendiente',
        c: '#92400E',
    },
    {
        est: 'Urocultivo',
        serv: 'Laboratorio',
        estado: 'Pendiente',
        c: '#92400E',
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

export default function ConsultaIndex() {
    const [activeTab, setActiveTab] = useState<'nota' | 'receta' | 'cuenta'>(
        'nota',
    );
    const [selHistory, setSelHistory] = useState<number | null>(null);
    const [showAntecedentes, setShowAntecedentes] = useState(false);
    const [rxRows, setRxRows] = useState(MOCK_RX);

    const selHist = MOCK_HISTORY.find((h) => h.id === selHistory);

    const TABS = [
        { key: 'nota', label: 'Nota clínica' },
        { key: 'receta', label: 'Receta' },
        { key: 'cuenta', label: 'Cuenta / Órdenes' },
    ];

    return (
        <div className="flex flex-col gap-5">
            {/* Patient header */}
            <div
                style={{
                    position: 'sticky',
                    top: 80,
                    zIndex: 20,
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 16,
                    boxShadow: '0 10px 24px -16px rgba(16,40,24,.25)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '16px 20px',
                        flexWrap: 'wrap',
                    }}
                >
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            flexShrink: 0,
                            borderRadius: '50%',
                            background: '#2E8B3E',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: 17,
                            boxShadow: '0 0 0 4px #EEF6E2',
                        }}
                    >
                        {PATIENT.ini}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                flexWrap: 'wrap',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: 'Bitter,Georgia,serif',
                                    fontWeight: 600,
                                    fontSize: 21,
                                    color: '#1f2d22',
                                }}
                            >
                                {PATIENT.name}
                            </span>
                            <StatusBadge state="consulta" />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: 6,
                                flexWrap: 'wrap',
                                marginTop: 6,
                            }}
                        >
                            {[PATIENT.edad, PATIENT.sexo, PATIENT.ced].map(
                                (v) => (
                                    <span
                                        key={v}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            height: 24,
                                            padding: '0 10px',
                                            borderRadius: 999,
                                            background: '#f3f5f1',
                                            fontSize: 12.5,
                                            color: '#3f3f46',
                                        }}
                                    >
                                        {v}
                                    </span>
                                ),
                            )}
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 16px 8px 8px',
                            borderRadius: 12,
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#b91c1c',
                        }}
                    >
                        <span
                            style={{
                                width: 34,
                                height: 34,
                                flexShrink: 0,
                                borderRadius: 10,
                                background: '#dc2626',
                                color: '#fff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 17,
                            }}
                        >
                            ⚠
                        </span>
                        <div style={{ lineHeight: 1.25 }}>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '.05em',
                                }}
                            >
                                Alergias
                            </div>
                            <div style={{ fontWeight: 600 }}>
                                {PATIENT.alergia}
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        borderTop: '1px solid #eef0ec',
                        background: '#fafbf8',
                    }}
                >
                    {[
                        { label: 'No. de atención', val: PATIENT.no },
                        { label: 'Área', val: PATIENT.area },
                        { label: 'Médico', val: PATIENT.medico },
                        { label: 'Llegada', val: PATIENT.ingreso },
                    ].map((f) => (
                        <div
                            key={f.label}
                            style={{
                                flex: '1 1 0',
                                padding: '10px 20px',
                                borderRight: '1px solid #eef0ec',
                                minWidth: 0,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: '#71717a',
                                    textTransform: 'uppercase',
                                    letterSpacing: '.05em',
                                }}
                            >
                                {f.label}
                            </div>
                            <div
                                style={{
                                    fontWeight: 600,
                                    fontVariantNumeric: 'tabular-nums',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {f.val}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action bar */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <div
                    style={{
                        display: 'inline-flex',
                        background: '#F3F7F2',
                        border: '1px solid #e3e9e3',
                        borderRadius: 11,
                        padding: 3,
                        gap: 2,
                    }}
                >
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() =>
                                setActiveTab(t.key as typeof activeTab)
                            }
                            style={{
                                whiteSpace: 'nowrap',
                                height: 30,
                                padding: '0 12px',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontWeight: 500,
                                background:
                                    activeTab === t.key
                                        ? '#fff'
                                        : 'transparent',
                                color:
                                    activeTab === t.key ? '#1f2d22' : '#52605a',
                                boxShadow:
                                    activeTab === t.key
                                        ? '0 1px 3px rgba(0,0,0,.1)'
                                        : 'none',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        style={{
                            whiteSpace: 'nowrap',
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
                        }}
                    >
                        🧪 Ordenar estudios
                    </button>
                    <button
                        style={{
                            whiteSpace: 'nowrap',
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
                        ✓ Dar alta médica
                    </button>
                </div>
            </div>

            {/* NOTA CLÍNICA */}
            {activeTab === 'nota' && (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 16,
                        alignItems: 'flex-start',
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            border: '1px solid #e3e9e3',
                            borderRadius: 14,
                            flex: '2 1 520px',
                            minWidth: 0,
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
                            <div
                                style={{
                                    fontFamily: 'Bitter,Georgia,serif',
                                    fontWeight: 600,
                                    fontSize: 16,
                                    color: '#1f2d22',
                                }}
                            >
                                Nota clínica
                            </div>
                            <span style={{ fontSize: 12, color: '#71717a' }}>
                                Guardado automático · 09:21
                            </span>
                        </div>
                        <div
                            style={{
                                padding: '16px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 16,
                            }}
                        >
                            {/* Vitals */}
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 8,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: '#2f4a17',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 3,
                                                height: 14,
                                                background: '#8CC63F',
                                                borderRadius: 2,
                                                display: 'inline-block',
                                            }}
                                        ></span>
                                        Signos vitales
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(auto-fill,minmax(118px,1fr))',
                                        gap: 8,
                                    }}
                                >
                                    {VITALS.map((v) => (
                                        <label
                                            key={v.k}
                                            style={{
                                                border: '1px solid #e4e4e7',
                                                background: '#fff',
                                                borderRadius: 10,
                                                padding: '6px 10px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 2,
                                                cursor: 'text',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 12,
                                                    color: '#71717a',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {v.k}
                                            </span>
                                            <span
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'baseline',
                                                    gap: 4,
                                                }}
                                            >
                                                <input
                                                    defaultValue={v.v}
                                                    placeholder={v.ph}
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        width: '100%',
                                                        border: 'none',
                                                        outline: 'none',
                                                        background:
                                                            'transparent',
                                                        padding: 0,
                                                        fontFamily: 'inherit',
                                                        fontWeight: 600,
                                                        fontVariantNumeric:
                                                            'tabular-nums',
                                                        color: '#1f2d22',
                                                        fontSize: 14,
                                                    }}
                                                />
                                                <span
                                                    style={{
                                                        fontSize: 11.5,
                                                        color: '#a1a1aa',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {v.u}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                    <div
                                        style={{
                                            border: '1px dashed #e4e4e7',
                                            borderRadius: 10,
                                            padding: '6px 10px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 2,
                                            background: '#fafafa',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: '#71717a',
                                            }}
                                        >
                                            IMC
                                        </span>
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                                color: '#1f2d22',
                                            }}
                                        >
                                            24.9{' '}
                                            <span
                                                style={{
                                                    fontSize: 11.5,
                                                    fontWeight: 400,
                                                    color: '#71717a',
                                                }}
                                            >
                                                Normal
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                <span style={{ fontWeight: 500 }}>
                                    Motivo de consulta
                                </span>
                                <textarea
                                    rows={2}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #e4e4e7',
                                        borderRadius: 10,
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        fontSize: 14,
                                    }}
                                    defaultValue="Ardor al orinar y dolor bajo el vientre desde hace 3 días."
                                ></textarea>
                            </label>
                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                <span style={{ fontWeight: 500 }}>
                                    Historia de la enfermedad actual
                                </span>
                                <textarea
                                    rows={3}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #e4e4e7',
                                        borderRadius: 10,
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        fontSize: 14,
                                    }}
                                    defaultValue="Paciente femenina de 42 años refiere disuria, polaquiuria y dolor suprapúbico de 3 días de evolución. Niega fiebre. FUM 20/09/2026."
                                ></textarea>
                            </label>
                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                <span style={{ fontWeight: 500 }}>
                                    Examen físico
                                </span>
                                <textarea
                                    rows={2}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #e4e4e7',
                                        borderRadius: 10,
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        fontSize: 14,
                                    }}
                                    defaultValue="Abdomen blando, depresible, dolor a la palpación en hipogastrio. Puño percusión negativa."
                                ></textarea>
                            </label>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                <span style={{ fontWeight: 500 }}>
                                    Diagnóstico (CIE-10)
                                </span>
                                <div
                                    style={{
                                        minHeight: 36,
                                        padding: '5px 8px',
                                        border: '1px solid #e4e4e7',
                                        borderRadius: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '3px 10px',
                                            borderRadius: 999,
                                            background: '#f4f4f5',
                                            fontSize: 13,
                                        }}
                                    >
                                        <strong style={{ fontWeight: 600 }}>
                                            N39.0
                                        </strong>{' '}
                                        Infección de vías urinarias
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: '#71717a',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            ✕
                                        </span>
                                    </span>
                                    <span
                                        style={{
                                            color: '#a1a1aa',
                                            fontSize: 13,
                                            paddingLeft: 4,
                                        }}
                                    >
                                        Buscar diagnóstico…
                                    </span>
                                </div>
                            </div>
                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                <span style={{ fontWeight: 500 }}>
                                    Plan e indicaciones
                                </span>
                                <textarea
                                    rows={2}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #e4e4e7',
                                        borderRadius: 10,
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                        fontSize: 14,
                                    }}
                                    defaultValue="Abundantes líquidos. Tratamiento según receta. Volver con resultados en 72 horas."
                                ></textarea>
                            </label>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                    gap: 12,
                                    paddingTop: 12,
                                    borderTop: '1px solid #eef0ec',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <span
                                    style={{ fontSize: 12.5, color: '#71717a' }}
                                >
                                    Guardado hace 2 minutos
                                </span>
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
                                    ✓ Guardar nota
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Antecedentes */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            flex: '1 1 320px',
                            minWidth: 0,
                        }}
                    >
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
                                    borderBottom: '1px solid #eef0ec',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>
                                    Antecedentes
                                </span>
                                <button
                                    onClick={() =>
                                        setShowAntecedentes(!showAntecedentes)
                                    }
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#2E8B3E',
                                        fontWeight: 600,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                >
                                    {showAntecedentes ? 'Guardar' : 'Editar'}
                                </button>
                            </div>
                            {!showAntecedentes && (
                                <div
                                    style={{
                                        padding: '14px 18px',
                                        display: 'grid',
                                        gridTemplateColumns: 'auto 1fr',
                                        gap: '8px 12px',
                                        fontSize: 13,
                                    }}
                                >
                                    <span style={{ color: '#71717a' }}>
                                        Personales
                                    </span>
                                    <span>HTA, Diabetes tipo 2</span>
                                    <span style={{ color: '#71717a' }}>
                                        Quirúrgicos
                                    </span>
                                    <span>Apendicectomía 2010</span>
                                    <span style={{ color: '#71717a' }}>
                                        Medicamentos
                                    </span>
                                    <span>
                                        Metformina 850 mg, Losartán 50 mg
                                    </span>
                                    <span style={{ color: '#71717a' }}>
                                        Familiares
                                    </span>
                                    <span>Madre con diabetes</span>
                                    <span style={{ color: '#71717a' }}>
                                        Alergias
                                    </span>
                                    <span
                                        style={{
                                            color: '#b91c1c',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Penicilina
                                    </span>
                                </div>
                            )}
                            {showAntecedentes && (
                                <div
                                    style={{
                                        padding: '14px 18px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 14,
                                        fontSize: 13,
                                    }}
                                >
                                    <label
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 6,
                                        }}
                                    >
                                        <span style={{ fontWeight: 500 }}>
                                            Personales
                                        </span>
                                        <input
                                            defaultValue="HTA, Diabetes tipo 2"
                                            style={{
                                                height: 34,
                                                padding: '0 10px',
                                                border: '1px solid #e4e4e7',
                                                borderRadius: 10,
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: 13,
                                            }}
                                        />
                                    </label>
                                    <label
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 6,
                                        }}
                                    >
                                        <span style={{ fontWeight: 500 }}>
                                            Quirúrgicos
                                        </span>
                                        <input
                                            defaultValue="Apendicectomía 2010"
                                            style={{
                                                height: 34,
                                                padding: '0 10px',
                                                border: '1px solid #e4e4e7',
                                                borderRadius: 10,
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: 13,
                                            }}
                                        />
                                    </label>
                                    <label
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 6,
                                        }}
                                    >
                                        <span style={{ fontWeight: 500 }}>
                                            Medicamentos actuales
                                        </span>
                                        <input
                                            defaultValue="Metformina 850 mg, Losartán 50 mg"
                                            style={{
                                                height: 34,
                                                padding: '0 10px',
                                                border: '1px solid #e4e4e7',
                                                borderRadius: 10,
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: 13,
                                            }}
                                        />
                                    </label>
                                    <label
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 6,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: 500,
                                                color: '#b91c1c',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            ⚠ Alergias
                                        </span>
                                        <input
                                            defaultValue="Penicilina"
                                            style={{
                                                height: 34,
                                                padding: '0 10px',
                                                border: '1px solid #fecaca',
                                                borderRadius: 10,
                                                outline: 'none',
                                                fontFamily: 'inherit',
                                                fontSize: 13,
                                            }}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* RECETA */}
            {activeTab === 'receta' && (
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
                            <div style={{ fontSize: 13, color: '#71717a' }}>
                                2 medicamentos
                            </div>
                        </div>
                        <button
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
                            }}
                        >
                            🖨 Imprimir receta
                        </button>
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
                                    <th style={{ ...thStyle, width: '14%' }}>
                                        Dosis
                                    </th>
                                    <th style={{ ...thStyle, width: '22%' }}>
                                        Frecuencia
                                    </th>
                                    <th style={{ ...thStyle, width: '24%' }}>
                                        Duración
                                    </th>
                                    <th style={{ ...thStyle, width: 44 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rxRows.map((m, i) => (
                                    <tr key={i}>
                                        <td
                                            style={{
                                                padding: '8px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
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
                                                    defaultValue={m.med}
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
                                                    defaultValue={m.via}
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
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                verticalAlign: 'top',
                                            }}
                                        >
                                            <input
                                                defaultValue={m.dosis}
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
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                verticalAlign: 'top',
                                            }}
                                        >
                                            <input
                                                defaultValue={m.frec}
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
                                                borderBottom:
                                                    '1px solid #eef0ec',
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
                                                    defaultValue={m.dias}
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        height: 32,
                                                        border: 'none',
                                                        outline: 'none',
                                                        background:
                                                            'transparent',
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
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                verticalAlign: 'top',
                                                textAlign: 'center',
                                            }}
                                        >
                                            <button
                                                onClick={() =>
                                                    setRxRows((r) =>
                                                        r.filter(
                                                            (_, j) => j !== i,
                                                        ),
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
                                        cont: false,
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
                    <div style={{ padding: 14 }}>
                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                            }}
                        >
                            <span style={{ fontWeight: 500 }}>
                                Indicaciones generales
                            </span>
                            <textarea
                                rows={2}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #e4e4e7',
                                    borderRadius: 10,
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    fontSize: 14,
                                }}
                                placeholder="Recomendaciones para el paciente"
                            ></textarea>
                        </label>
                    </div>
                    <div
                        style={{
                            padding: '12px 18px',
                            borderTop: '1px solid #eef0ec',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: 12,
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
            )}

            {/* CUENTA / ÓRDENES */}
            {activeTab === 'cuenta' && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                        gap: 16,
                        alignItems: 'start',
                    }}
                >
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
                                fontFamily: 'Bitter,Georgia,serif',
                                fontWeight: 600,
                                fontSize: 16,
                                color: '#1f2d22',
                            }}
                        >
                            Órdenes
                        </div>
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, paddingLeft: 18 }}>
                                        Estudio
                                    </th>
                                    <th style={thStyle}>Servicio</th>
                                    <th style={thStyle}>Facturación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ORDENES.map((o, i) => (
                                    <tr key={i}>
                                        <td
                                            style={{
                                                padding: '12px 18px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {o.est}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                            }}
                                        >
                                            {o.serv}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    padding: '3px 10px',
                                                    borderRadius: 999,
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    border: '1px solid #e4e4e7',
                                                    color: o.c,
                                                }}
                                            >
                                                {o.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                                fontFamily: 'Bitter,Georgia,serif',
                                fontWeight: 600,
                                fontSize: 16,
                                color: '#1f2d22',
                            }}
                        >
                            Cargos a la cuenta
                        </div>
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, paddingLeft: 18 }}>
                                        Descripción
                                    </th>
                                    <th
                                        style={{
                                            ...thStyle,
                                            textAlign: 'right',
                                        }}
                                    >
                                        Cant.
                                    </th>
                                    <th
                                        style={{
                                            ...thStyle,
                                            textAlign: 'right',
                                            paddingRight: 18,
                                        }}
                                    >
                                        Importe
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_CARGOS.map((c, i) => (
                                    <tr key={i}>
                                        <td
                                            style={{
                                                padding: '12px 18px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                            }}
                                        >
                                            {c.desc}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {c.cant}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 18px',
                                                borderBottom:
                                                    '1px solid #eef0ec',
                                                textAlign: 'right',
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                            }}
                                        >
                                            {c.imp}
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td
                                        style={{
                                            padding: '12px 18px',
                                            fontWeight: 600,
                                        }}
                                        colSpan={2}
                                    >
                                        Total acumulado
                                    </td>
                                    <td
                                        style={{
                                            padding: '12px 18px',
                                            textAlign: 'right',
                                            fontWeight: 600,
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        RD$3,300.00
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Clinical history */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 14,
                    overflow: 'hidden',
                    marginTop: 8,
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
                            Historial en la clínica
                        </div>
                        <div style={{ fontSize: 13, color: '#71717a' }}>
                            3 registros
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'stretch',
                    }}
                >
                    <div
                        style={{
                            flex: '1 1 320px',
                            minWidth: 0,
                            borderRight: '1px solid #eef0ec',
                            maxHeight: 400,
                            overflowY: 'auto',
                        }}
                    >
                        {MOCK_HISTORY.map((e) => (
                            <button
                                key={e.id}
                                onClick={() =>
                                    setSelHistory(
                                        e.id === selHistory ? null : e.id,
                                    )
                                }
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    border: 'none',
                                    borderBottom: '1px solid #f4f4f5',
                                    background:
                                        e.id === selHistory
                                            ? '#F8FBF6'
                                            : '#fff',
                                    cursor: 'pointer',
                                    padding: '12px 20px',
                                    display: 'flex',
                                    gap: 12,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <span
                                    style={{
                                        width: 3,
                                        alignSelf: 'stretch',
                                        borderRadius: 2,
                                        background: e.bar,
                                        flexShrink: 0,
                                    }}
                                ></span>
                                <div
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 3,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            gap: '4px 8px',
                                            fontSize: 12,
                                        }}
                                    >
                                        <span
                                            style={{
                                                padding: '1px 8px',
                                                borderRadius: 999,
                                                background: e.tbg,
                                                color: e.tfg,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {e.area}
                                        </span>
                                        <span
                                            style={{
                                                color: '#71717a',
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                            }}
                                        >
                                            {e.f}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            color: '#1f2d22',
                                            fontSize: 13.5,
                                        }}
                                    >
                                        {e.tit}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: '#71717a',
                                        }}
                                    >
                                        {e.med} · {e.esp}
                                    </div>
                                </div>
                                <span
                                    style={{
                                        fontSize: 15,
                                        color: '#a1a1aa',
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}
                                >
                                    ›
                                </span>
                            </button>
                        ))}
                    </div>
                    <div
                        style={{
                            flex: '2 1 480px',
                            minWidth: 0,
                            padding: '20px 24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            fontSize: 13.5,
                        }}
                    >
                        {selHist ? (
                            <>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <span
                                        style={{
                                            padding: '2px 10px',
                                            borderRadius: 999,
                                            background: selHist.tbg,
                                            color: selHist.tfg,
                                            fontWeight: 600,
                                            fontSize: 12,
                                        }}
                                    >
                                        {selHist.area}
                                    </span>
                                    <span
                                        style={{
                                            color: '#71717a',
                                            fontSize: 12.5,
                                        }}
                                    >
                                        {selHist.f}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontFamily: 'Bitter,Georgia,serif',
                                        fontWeight: 600,
                                        fontSize: 19,
                                        color: '#1f2d22',
                                    }}
                                >
                                    {selHist.tit}
                                </div>
                                <div style={{ color: '#52525b' }}>
                                    {selHist.med} · {selHist.esp}
                                </div>
                                {selHist.dx && (
                                    <div
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: 10,
                                            background: '#F6FAF1',
                                            border: '1px solid #DCEBC9',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: '#56693f',
                                                textTransform: 'uppercase',
                                                letterSpacing: '.05em',
                                            }}
                                        >
                                            Diagnóstico
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                color: '#1f2d22',
                                                marginTop: 2,
                                            }}
                                        >
                                            {selHist.dx}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div
                                style={{
                                    color: '#71717a',
                                    textAlign: 'center',
                                    padding: '40px 0',
                                }}
                            >
                                Selecciona un registro para ver el detalle.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
