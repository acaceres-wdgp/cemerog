import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StatusBadge from '@/components/cemerog/StatusBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

type Diagnostico = { code: string; label: string };

type Vitals = {
    peso: number | null;
    talla: number | null;
    temp: number | null;
    presion_arterial: string | null;
    frecuencia_cardiaca: number | null;
    frecuencia_respiratoria: number | null;
    saturacion_o2: number | null;
    glucemia: number | null;
};

type PatientInfo = {
    id: number;
    full_name: string;
    age: number;
    sex: string;
    allergies: string | null;
};

type DoctorInfo = {
    id: number;
    full_name: string;
    specialty: string | null;
};

type TurnItem = {
    id: number;
    turn_number: number;
    turn_order: number;
    status: string;
    arrived_at: string;
    patient: PatientInfo;
    doctor: DoctorInfo;
};

type HistorialEntry = {
    id: number;
    consulted_at: string;
    doctor: { id: number; full_name: string; specialty: string | null };
    motivo_consulta: string | null;
    historia_enfermedad: string | null;
    examen_fisico: string | null;
    diagnosticos: Diagnostico[] | null;
    plan_tratamiento: string | null;
    vitals: Vitals;
};

type AntecedentData = {
    personales: string | null;
    quirurgicos: string | null;
    medicamentos: string | null;
    familiares: string | null;
    alergias: string | null;
} | null;

type Props = {
    turns_en_consulta: TurnItem[];
    turns_en_espera: TurnItem[];
    historial?: HistorialEntry[];
    historial_patient?: PatientInfo & { antecedents: AntecedentData };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function initials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function computeImc(peso: number | null, talla: number | null): string {
    if (!peso || !talla || talla === 0) return '—';
    const pesoKg = peso / 10;
    const tallaMt = talla / 100;
    const imc = pesoKg / (tallaMt * tallaMt);
    const cat = imc < 18.5 ? 'Bajo' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad';
    return `${imc.toFixed(1)} ${cat}`;
}

// ─── Queue Selector ───────────────────────────────────────────────────────────

function QueueSelector({
    turnsEspera,
    turnsConsulta,
    activeTurnId,
    onSelect,
}: {
    turnsEspera: TurnItem[];
    turnsConsulta: TurnItem[];
    activeTurnId: number | null;
    onSelect: (turn: TurnItem) => void;
}) {
    const all = [...turnsConsulta, ...turnsEspera];
    if (all.length === 0) {
        return (
            <div style={{ padding: '16px 20px', color: '#71717a', fontSize: 13.5, textAlign: 'center' }}>
                No hay pacientes en turno hoy.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {all.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t)}
                    style={{
                        textAlign: 'left',
                        border: 'none',
                        borderBottom: '1px solid #f4f4f5',
                        background: t.id === activeTurnId ? '#F8FBF6' : '#fff',
                        cursor: 'pointer',
                        padding: '10px 20px',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                    }}
                >
                    <span
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#EEF6E2',
                            color: '#2E8B3E',
                            fontWeight: 700,
                            fontSize: 13,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        T-{String(t.turn_number).padStart(2, '0')}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1f2d22' }}>{t.patient.full_name}</div>
                        <div style={{ fontSize: 12, color: '#71717a' }}>{t.doctor.full_name} · {t.doctor.specialty}</div>
                    </div>
                    <span
                        style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 11.5,
                            fontWeight: 600,
                            background: t.status === 'en_consulta' ? '#DBEAFE' : '#F3F7F2',
                            color: t.status === 'en_consulta' ? '#1E40AF' : '#52605a',
                        }}
                    >
                        {t.status === 'en_consulta' ? 'En consulta' : 'En espera'}
                    </span>
                </button>
            ))}
        </div>
    );
}

// ─── Patient Header ───────────────────────────────────────────────────────────

function PatientHeader({ turn }: { turn: TurnItem }) {
    const p = turn.patient;
    const d = turn.doctor;
    const arrivedAt = new Date(turn.arrived_at);

    return (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', flexWrap: 'wrap' }}>
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
                    {initials(p.full_name)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span
                            style={{
                                fontFamily: 'Bitter,Georgia,serif',
                                fontWeight: 600,
                                fontSize: 21,
                                color: '#1f2d22',
                            }}
                        >
                            {p.full_name}
                        </span>
                        <StatusBadge state="consulta" />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {[`${p.age} años`, p.sex === 'M' ? 'Masculino' : 'Femenino'].map((v) => (
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
                        ))}
                    </div>
                </div>
                {p.allergies && (
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
                            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                                Alergias
                            </div>
                            <div style={{ fontWeight: 600 }}>{p.allergies}</div>
                        </div>
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', borderTop: '1px solid #eef0ec', background: '#fafbf8' }}>
                {[
                    { label: 'No. de turno', val: `T-${String(turn.turn_number).padStart(2, '0')}` },
                    { label: 'Área', val: 'Consulta' },
                    { label: 'Médico', val: d.full_name },
                    { label: 'Llegada', val: format(arrivedAt, 'HH:mm', { locale: es }) },
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
    );
}

// ─── Clinical Note Form ───────────────────────────────────────────────────────

type NoteFormData = {
    motivo_consulta: string;
    historia_enfermedad: string;
    examen_fisico: string;
    plan_tratamiento: string;
    presion_arterial: string;
    frecuencia_cardiaca: string;
    frecuencia_respiratoria: string;
    temp: string;
    saturacion_o2: string;
    glucemia: string;
    peso: string;
    talla: string;
    diagnosticos: Diagnostico[];
};

function NotaClinica({
    turn,
    antecedents,
    patientId,
}: {
    turn: TurnItem;
    antecedents: AntecedentData;
    patientId: number;
}) {
    const [form, setForm] = useState<NoteFormData>({
        motivo_consulta: '',
        historia_enfermedad: '',
        examen_fisico: '',
        plan_tratamiento: '',
        presion_arterial: '',
        frecuencia_cardiaca: '',
        frecuencia_respiratoria: '',
        temp: '',
        saturacion_o2: '',
        glucemia: '',
        peso: '',
        talla: '',
        diagnosticos: [],
    });
    const [dxInput, setDxInput] = useState('');
    const [showAnte, setShowAnte] = useState(false);
    const [anteForm, setAnteForm] = useState({
        personales: antecedents?.personales ?? '',
        quirurgicos: antecedents?.quirurgicos ?? '',
        medicamentos: antecedents?.medicamentos ?? '',
        familiares: antecedents?.familiares ?? '',
        alergias: antecedents?.alergias ?? '',
    });

    const imc = computeImc(form.peso ? Number(form.peso) * 10 : null, form.talla ? Number(form.talla) : null);

    const VITALS = [
        { key: 'presion_arterial', label: 'Presión arterial', unit: 'mmHg', isString: true },
        { key: 'frecuencia_cardiaca', label: 'Frec. cardíaca', unit: 'lpm', isString: false },
        { key: 'frecuencia_respiratoria', label: 'Frec. respiratoria', unit: 'rpm', isString: false },
        { key: 'temp', label: 'Temperatura', unit: '°C', isString: false },
        { key: 'saturacion_o2', label: 'SpO₂', unit: '%', isString: false },
        { key: 'glucemia', label: 'Glucemia', unit: 'mg/dL', isString: false },
        { key: 'peso', label: 'Peso', unit: 'kg', isString: false },
        { key: 'talla', label: 'Talla', unit: 'cm', isString: false },
    ] as const;

    function handleAddDx() {
        const raw = dxInput.trim();
        if (!raw) return;
        const match = raw.match(/^([A-Z]\d{2}(?:\.\d+)?)\s+(.+)$/);
        if (match) {
            setForm((f) => ({
                ...f,
                diagnosticos: [...f.diagnosticos, { code: match[1], label: match[2] }],
            }));
        } else {
            setForm((f) => ({
                ...f,
                diagnosticos: [...f.diagnosticos, { code: '—', label: raw }],
            }));
        }
        setDxInput('');
    }

    function handleSaveNote() {
        router.post('/consulta', {
            patient_id: turn.patient.id,
            doctor_id: turn.doctor.id,
            turn_id: turn.id,
            motivo_consulta: form.motivo_consulta || null,
            historia_enfermedad: form.historia_enfermedad || null,
            examen_fisico: form.examen_fisico || null,
            plan_tratamiento: form.plan_tratamiento || null,
            presion_arterial: form.presion_arterial || null,
            frecuencia_cardiaca: form.frecuencia_cardiaca ? Number(form.frecuencia_cardiaca) : null,
            frecuencia_respiratoria: form.frecuencia_respiratoria ? Number(form.frecuencia_respiratoria) : null,
            temp: form.temp ? Math.round(Number(form.temp) * 10) : null,
            saturacion_o2: form.saturacion_o2 ? Number(form.saturacion_o2) : null,
            glucemia: form.glucemia ? Number(form.glucemia) : null,
            peso: form.peso ? Math.round(Number(form.peso) * 10) : null,
            talla: form.talla ? Number(form.talla) : null,
            diagnosticos: form.diagnosticos.length ? form.diagnosticos : null,
        });
    }

    function handleSaveAnte() {
        router.patch(`/consulta/antecedentes/${patientId}`, anteForm, {
            onSuccess: () => setShowAnte(false),
        });
    }

    const textareaStyle: React.CSSProperties = {
        padding: '8px 12px',
        border: '1px solid #e4e4e7',
        borderRadius: 10,
        outline: 'none',
        fontFamily: 'inherit',
        fontSize: 14,
        resize: 'vertical',
        width: '100%',
        boxSizing: 'border-box',
    };

    const inputStyle: React.CSSProperties = {
        height: 34,
        padding: '0 10px',
        border: '1px solid #e4e4e7',
        borderRadius: 10,
        outline: 'none',
        fontFamily: 'inherit',
        fontSize: 13,
        width: '100%',
        boxSizing: 'border-box',
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
            {/* Clinical note */}
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
                    <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>
                        Nota clínica
                    </div>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Vitals */}
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#2f4a17',
                            }}
                        >
                            <span style={{ width: 3, height: 14, background: '#8CC63F', borderRadius: 2, display: 'inline-block' }} />
                            Signos vitales
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(118px,1fr))', gap: 8 }}>
                            {VITALS.map((v) => (
                                <label
                                    key={v.key}
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
                                    <span style={{ fontSize: 12, color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {v.label}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                        <input
                                            value={form[v.key]}
                                            onChange={(e) => setForm((f) => ({ ...f, [v.key]: e.target.value }))}
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                                width: '100%',
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                padding: 0,
                                                fontFamily: 'inherit',
                                                fontWeight: 600,
                                                fontVariantNumeric: 'tabular-nums',
                                                color: '#1f2d22',
                                                fontSize: 14,
                                            }}
                                        />
                                        <span style={{ fontSize: 11.5, color: '#a1a1aa', whiteSpace: 'nowrap' }}>{v.unit}</span>
                                    </span>
                                </label>
                            ))}
                            {/* IMC (auto-computed) */}
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
                                <span style={{ fontSize: 12, color: '#71717a' }}>IMC</span>
                                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#1f2d22', fontSize: 14 }}>
                                    {imc}
                                </span>
                            </div>
                        </div>
                    </div>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontWeight: 500 }}>Motivo de consulta</span>
                        <textarea
                            rows={2}
                            style={textareaStyle}
                            value={form.motivo_consulta}
                            onChange={(e) => setForm((f) => ({ ...f, motivo_consulta: e.target.value }))}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontWeight: 500 }}>Historia de la enfermedad actual</span>
                        <textarea
                            rows={3}
                            style={textareaStyle}
                            value={form.historia_enfermedad}
                            onChange={(e) => setForm((f) => ({ ...f, historia_enfermedad: e.target.value }))}
                        />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontWeight: 500 }}>Examen físico</span>
                        <textarea
                            rows={2}
                            style={textareaStyle}
                            value={form.examen_fisico}
                            onChange={(e) => setForm((f) => ({ ...f, examen_fisico: e.target.value }))}
                        />
                    </label>

                    {/* Diagnóstico CIE-10 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontWeight: 500 }}>Diagnóstico (CIE-10)</span>
                        <div
                            style={{
                                minHeight: 42,
                                padding: '5px 8px',
                                border: '1px solid #e4e4e7',
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                flexWrap: 'wrap',
                            }}
                        >
                            {form.diagnosticos.map((dx, i) => (
                                <span
                                    key={i}
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
                                    <strong style={{ fontWeight: 600 }}>{dx.code}</strong> {dx.label}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                diagnosticos: f.diagnosticos.filter((_, j) => j !== i),
                                            }))
                                        }
                                        style={{ border: 'none', background: 'transparent', color: '#71717a', cursor: 'pointer', padding: 0, fontSize: 13 }}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                            <input
                                value={dxInput}
                                onChange={(e) => setDxInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); handleAddDx(); }
                                }}
                                placeholder="Ej: N39.0 Infección de vías urinarias"
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    fontFamily: 'inherit',
                                    fontSize: 13,
                                    flex: 1,
                                    minWidth: 180,
                                    color: form.diagnosticos.length === 0 ? '#a1a1aa' : '#1f2d22',
                                }}
                            />
                        </div>
                    </div>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontWeight: 500 }}>Plan e indicaciones</span>
                        <textarea
                            rows={2}
                            style={textareaStyle}
                            value={form.plan_tratamiento}
                            onChange={(e) => setForm((f) => ({ ...f, plan_tratamiento: e.target.value }))}
                        />
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
                        <button
                            onClick={handleSaveNote}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: '1 1 320px', minWidth: 0 }}>
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14 }}>
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
                        <span style={{ fontWeight: 600 }}>Antecedentes</span>
                        <button
                            onClick={() => (showAnte ? handleSaveAnte() : setShowAnte(true))}
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
                            {showAnte ? 'Guardar' : 'Editar'}
                        </button>
                    </div>

                    {!showAnte && (
                        <div
                            style={{
                                padding: '14px 18px',
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr',
                                gap: '8px 12px',
                                fontSize: 13,
                            }}
                        >
                            {[
                                { label: 'Personales', val: antecedents?.personales },
                                { label: 'Quirúrgicos', val: antecedents?.quirurgicos },
                                { label: 'Medicamentos', val: antecedents?.medicamentos },
                                { label: 'Familiares', val: antecedents?.familiares },
                            ].map((row) => (
                                <>
                                    <span key={row.label + '-l'} style={{ color: '#71717a' }}>{row.label}</span>
                                    <span key={row.label + '-v'}>{row.val || <span style={{ color: '#a1a1aa' }}>—</span>}</span>
                                </>
                            ))}
                            <span style={{ color: '#71717a' }}>Alergias</span>
                            <span style={{ color: antecedents?.alergias ? '#b91c1c' : '#a1a1aa', fontWeight: antecedents?.alergias ? 600 : 400 }}>
                                {antecedents?.alergias || '—'}
                            </span>
                        </div>
                    )}

                    {showAnte && (
                        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
                            {[
                                { key: 'personales', label: 'Personales' },
                                { key: 'quirurgicos', label: 'Quirúrgicos' },
                                { key: 'medicamentos', label: 'Medicamentos actuales' },
                                { key: 'familiares', label: 'Familiares' },
                            ].map((f) => (
                                <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontWeight: 500 }}>{f.label}</span>
                                    <input
                                        value={anteForm[f.key as keyof typeof anteForm] ?? ''}
                                        onChange={(e) => setAnteForm((a) => ({ ...a, [f.key]: e.target.value }))}
                                        style={inputStyle}
                                    />
                                </label>
                            ))}
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontWeight: 500, color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    ⚠ Alergias
                                </span>
                                <input
                                    value={anteForm.alergias ?? ''}
                                    onChange={(e) => setAnteForm((a) => ({ ...a, alergias: e.target.value }))}
                                    style={{ ...inputStyle, border: '1px solid #fecaca' }}
                                />
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Historial Panel ──────────────────────────────────────────────────────────

function HistorialPanel({ historial }: { historial: HistorialEntry[] }) {
    const [selId, setSelId] = useState<number | null>(historial[0]?.id ?? null);
    const sel = historial.find((h) => h.id === selId);

    return (
        <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
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
                    <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>
                        Historial en la clínica
                    </div>
                    <div style={{ fontSize: 13, color: '#71717a' }}>{historial.length} registros</div>
                </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
                {/* Left list */}
                <div style={{ flex: '1 1 320px', minWidth: 0, borderRight: '1px solid #eef0ec', maxHeight: 400, overflowY: 'auto' }}>
                    {historial.map((e) => {
                        const dx0 = e.diagnosticos?.[0];
                        const dateStr = format(new Date(e.consulted_at), 'dd/MM/yyyy', { locale: es });
                        return (
                            <button
                                key={e.id}
                                onClick={() => setSelId(e.id === selId ? null : e.id)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    border: 'none',
                                    borderBottom: '1px solid #f4f4f5',
                                    background: e.id === selId ? '#F8FBF6' : '#fff',
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
                                        background: '#2563EB',
                                        flexShrink: 0,
                                    }}
                                />
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', fontSize: 12 }}>
                                        <span style={{ padding: '1px 8px', borderRadius: 999, background: '#DBEAFE', color: '#1E40AF', fontWeight: 600 }}>
                                            Consulta
                                        </span>
                                        <span style={{ color: '#71717a', fontVariantNumeric: 'tabular-nums' }}>{dateStr}</span>
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#1f2d22', fontSize: 13.5 }}>
                                        {dx0 ? `${dx0.code} – ${dx0.label}` : e.motivo_consulta ?? 'Sin diagnóstico'}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#71717a' }}>
                                        {e.doctor.full_name} · {e.doctor.specialty ?? ''}
                                    </div>
                                </div>
                                <span style={{ fontSize: 15, color: '#a1a1aa', flexShrink: 0, marginTop: 2 }}>›</span>
                            </button>
                        );
                    })}
                </div>

                {/* Right detail */}
                <div style={{ flex: '2 1 480px', minWidth: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13.5 }}>
                    {sel ? (
                        <>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ padding: '2px 10px', borderRadius: 999, background: '#DBEAFE', color: '#1E40AF', fontWeight: 600, fontSize: 12 }}>
                                    Consulta
                                </span>
                                <span style={{ color: '#71717a', fontSize: 12.5 }}>
                                    {format(new Date(sel.consulted_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </span>
                            </div>
                            <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 19, color: '#1f2d22' }}>
                                {sel.diagnosticos?.[0] ? `${sel.diagnosticos[0].code} – ${sel.diagnosticos[0].label}` : sel.motivo_consulta ?? 'Sin diagnóstico'}
                            </div>
                            <div style={{ color: '#52525b' }}>{sel.doctor.full_name} · {sel.doctor.specialty}</div>

                            {sel.diagnosticos && sel.diagnosticos.length > 0 && (
                                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#F6FAF1', border: '1px solid #DCEBC9' }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#56693f', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                                        Diagnóstico(s)
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                                        {sel.diagnosticos.map((dx, i) => (
                                            <div key={i} style={{ fontWeight: 600, color: '#1f2d22' }}>
                                                {dx.code} – {dx.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sel.motivo_consulta && (
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                                        Motivo
                                    </div>
                                    <p style={{ margin: 0, color: '#1f2d22' }}>{sel.motivo_consulta}</p>
                                </div>
                            )}

                            {sel.plan_tratamiento && (
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                                        Plan
                                    </div>
                                    <p style={{ margin: 0, color: '#1f2d22' }}>{sel.plan_tratamiento}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ color: '#71717a', textAlign: 'center', padding: '40px 0' }}>
                            Selecciona un registro para ver el detalle.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConsultaIndex({ turns_en_consulta, turns_en_espera, historial, historial_patient }: Props) {
    const [activeTurn, setActiveTurn] = useState<TurnItem | null>(turns_en_consulta[0] ?? null);
    const [showQueue, setShowQueue] = useState(false);
    const [activeTab, setActiveTab] = useState<'nota' | 'receta' | 'cuenta'>('nota');
    const [rxRows, setRxRows] = useState([{ med: '', via: '', dosis: '', frec: '', dias: '' }]);

    const TABS = [
        { key: 'nota', label: 'Nota clínica' },
        { key: 'receta', label: 'Receta' },
        { key: 'cuenta', label: 'Cuenta / Órdenes' },
    ];

    const antecedents = historial_patient?.antecedents ?? null;
    const displayedHistorial = historial ?? [];

    return (
        <div className="flex flex-col gap-5">
            {/* Queue panel toggle + selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 700, fontSize: 22, color: '#1f2d22', margin: 0 }}>
                        Consulta
                    </h1>
                    <p style={{ margin: 0, fontSize: 13, color: '#71717a' }}>
                        {turns_en_consulta.length} en consulta · {turns_en_espera.length} en espera
                    </p>
                </div>
                <button
                    onClick={() => setShowQueue((v) => !v)}
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
                    {showQueue ? '✕ Cerrar cola' : '☰ Ver cola de turnos'}
                </button>
            </div>

            {showQueue && (
                <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid #eef0ec', fontWeight: 600, fontSize: 14 }}>
                        Cola de pacientes – hoy
                    </div>
                    <QueueSelector
                        turnsEspera={turns_en_espera}
                        turnsConsulta={turns_en_consulta}
                        activeTurnId={activeTurn?.id ?? null}
                        onSelect={(t) => { setActiveTurn(t); setShowQueue(false); }}
                    />
                </div>
            )}

            {activeTurn ? (
                <>
                    {/* Patient header */}
                    <PatientHeader turn={activeTurn} />

                    {/* Action bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
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
                                    onClick={() => setActiveTab(t.key as typeof activeTab)}
                                    style={{
                                        whiteSpace: 'nowrap',
                                        height: 30,
                                        padding: '0 12px',
                                        border: 'none',
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        background: activeTab === t.key ? '#fff' : 'transparent',
                                        color: activeTab === t.key ? '#1f2d22' : '#52605a',
                                        boxShadow: activeTab === t.key ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
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
                                onClick={() => router.get(`/consulta/historial/${activeTurn.patient.id}`)}
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
                                📋 Ver historial
                            </button>
                        </div>
                    </div>

                    {/* NOTA */}
                    {activeTab === 'nota' && (
                        <NotaClinica
                            turn={activeTurn}
                            antecedents={antecedents}
                            patientId={activeTurn.patient.id}
                        />
                    )}

                    {/* RECETA */}
                    {activeTab === 'receta' && (
                        <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14 }}>
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
                                    <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>
                                        Receta
                                    </div>
                                    <div style={{ fontSize: 13, color: '#71717a' }}>{rxRows.length} medicamentos</div>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...thStyle, paddingLeft: 18, width: '34%' }}>Medicamento</th>
                                            <th style={{ ...thStyle, width: '14%' }}>Dosis</th>
                                            <th style={{ ...thStyle, width: '22%' }}>Frecuencia</th>
                                            <th style={{ ...thStyle, width: '24%' }}>Duración</th>
                                            <th style={{ ...thStyle, width: 44 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rxRows.map((m, i) => (
                                            <tr key={i}>
                                                <td style={{ padding: '8px', borderBottom: '1px solid #eef0ec', verticalAlign: 'top', paddingLeft: 18 }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        <input
                                                            value={m.med}
                                                            onChange={(e) => setRxRows((r) => r.map((row, j) => j === i ? { ...row, med: e.target.value } : row))}
                                                            placeholder="Medicamento"
                                                            style={{ height: 34, width: '100%', padding: '0 10px', border: '1px solid #e4e4e7', borderRadius: 8, outline: 'none', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500 }}
                                                        />
                                                        <input
                                                            value={m.via}
                                                            onChange={(e) => setRxRows((r) => r.map((row, j) => j === i ? { ...row, via: e.target.value } : row))}
                                                            placeholder="Vía"
                                                            style={{ height: 28, width: '100%', padding: '0 10px', border: '1px solid #eef0ec', borderRadius: 8, outline: 'none', fontFamily: 'inherit', fontSize: 12.5, color: '#52525b' }}
                                                        />
                                                    </div>
                                                </td>
                                                <td style={{ padding: 8, borderBottom: '1px solid #eef0ec', verticalAlign: 'top' }}>
                                                    <input
                                                        value={m.dosis}
                                                        onChange={(e) => setRxRows((r) => r.map((row, j) => j === i ? { ...row, dosis: e.target.value } : row))}
                                                        placeholder="Dosis"
                                                        style={{ height: 34, width: '100%', padding: '0 10px', border: '1px solid #e4e4e7', borderRadius: 8, outline: 'none', fontFamily: 'inherit', fontSize: 13.5 }}
                                                    />
                                                </td>
                                                <td style={{ padding: 8, borderBottom: '1px solid #eef0ec', verticalAlign: 'top' }}>
                                                    <input
                                                        value={m.frec}
                                                        onChange={(e) => setRxRows((r) => r.map((row, j) => j === i ? { ...row, frec: e.target.value } : row))}
                                                        placeholder="Frecuencia"
                                                        style={{ height: 34, width: '100%', padding: '0 10px', border: '1px solid #e4e4e7', borderRadius: 8, outline: 'none', fontFamily: 'inherit', fontSize: 13.5 }}
                                                    />
                                                </td>
                                                <td style={{ padding: 8, borderBottom: '1px solid #eef0ec', verticalAlign: 'top' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', height: 34, border: '1px solid #e4e4e7', borderRadius: 8, background: '#fff' }}>
                                                        <input
                                                            value={m.dias}
                                                            onChange={(e) => setRxRows((r) => r.map((row, j) => j === i ? { ...row, dias: e.target.value } : row))}
                                                            style={{ flex: 1, minWidth: 0, height: 32, border: 'none', outline: 'none', background: 'transparent', padding: '0 10px', fontFamily: 'inherit', fontSize: 13.5 }}
                                                        />
                                                        <span style={{ paddingRight: 10, fontSize: 12.5, color: '#71717a' }}>días</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: 8, borderBottom: '1px solid #eef0ec', verticalAlign: 'top', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => setRxRows((r) => r.filter((_, j) => j !== i))}
                                                        style={{ width: 34, height: 34, border: 'none', borderRadius: 8, background: 'transparent', color: '#71717a', cursor: 'pointer', fontSize: 16 }}
                                                    >
                                                        🗑
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ padding: '10px 18px', borderBottom: '1px solid #eef0ec' }}>
                                <button
                                    onClick={() => setRxRows((r) => [...r, { med: '', via: '', dosis: '', frec: '', dias: '' }])}
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
                            <div style={{ padding: '12px 18px', borderTop: '1px solid #eef0ec', display: 'flex', justifyContent: 'flex-end' }}>
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

                    {/* CUENTA */}
                    {activeTab === 'cuenta' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
                            <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                                <div style={{ padding: '14px 18px', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>
                                    Órdenes
                                </div>
                                <div style={{ padding: '20px', color: '#71717a', fontSize: 13, textAlign: 'center' }}>
                                    No hay órdenes para esta consulta.
                                </div>
                            </div>
                            <div style={{ background: '#fff', border: '1px solid #e3e9e3', borderRadius: 14, overflow: 'hidden' }}>
                                <div style={{ padding: '14px 18px', fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 16, color: '#1f2d22' }}>
                                    Cargos a la cuenta
                                </div>
                                <div style={{ padding: '20px', color: '#71717a', fontSize: 13, textAlign: 'center' }}>
                                    No hay cargos registrados.
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* No active turn */
                <div
                    style={{
                        background: '#fff',
                        border: '1px solid #e3e9e3',
                        borderRadius: 16,
                        padding: '48px 24px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🩺</div>
                    <div style={{ fontFamily: 'Bitter,Georgia,serif', fontWeight: 600, fontSize: 18, color: '#1f2d22', marginBottom: 8 }}>
                        Sin paciente activo
                    </div>
                    <p style={{ color: '#71717a', margin: '0 0 20px' }}>
                        Selecciona un paciente de la cola de turnos para iniciar la consulta.
                    </p>
                    <button
                        onClick={() => setShowQueue(true)}
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
                        ☰ Ver cola de turnos
                    </button>
                </div>
            )}

            {/* Historial clínico */}
            {displayedHistorial.length > 0 && (
                <HistorialPanel historial={displayedHistorial} />
            )}
        </div>
    );
}
