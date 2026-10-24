import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { MaskedInput } from '@/components/cemerog/masked-input';

type Specialty = {
    id: number;
    name: string;
    consultation_price: number;
    doctors_count: number;
};

type Doctor = {
    id: number;
    name: string;
    exequatur: string | null;
    phone: string | null;
    specialty_id: number;
    specialty_name: string;
    is_active: boolean;
};

type Props = {
    specialties: Specialty[];
    doctors: Doctor[];
};

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

const inputStyle: React.CSSProperties = {
    height: 36,
    border: '1px solid #e4e4e7',
    borderRadius: 10,
    padding: '0 12px',
    fontFamily: 'inherit',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
};

const fmt = (centavos: number) =>
    `RD$${(centavos / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

function initials(name: string): string {
    return name
        .replace(/^Dra?\.\s+/, '')
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('');
}

// ─── Specialty Modal ──────────────────────────────────────────────────────────

type SpecialtyModalProps = {
    onClose: () => void;
    specialty?: Specialty | null;
};

function SpecialtyModal({ onClose, specialty }: SpecialtyModalProps) {
    const isEdit = Boolean(specialty);
    const { data, setData, post, put, transform, processing, errors } = useForm(
        {
            name: specialty?.name ?? '',
            consultation_price: specialty
                ? (specialty.consultation_price / 100).toString()
                : '',
        },
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((form) => ({
            name: form.name,
            consultation_price: Math.round(
                parseFloat(form.consultation_price || '0') * 100,
            ),
        }));

        if (isEdit && specialty) {
            put(`/admin/doctores/especialidades/${specialty.id}`, {
                onSuccess: onClose,
            });
        } else {
            post('/admin/doctores/especialidades', { onSuccess: onClose });
        }
    };

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 40,
                    background: 'rgba(0,0,0,.4)',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    zIndex: 41,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 420,
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
                        {isEdit ? 'Editar especialidad' : 'Nueva especialidad'}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
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
                <form onSubmit={handleSubmit}>
                    <div
                        style={{
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
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
                            <span>Nombre de la especialidad *</span>
                            <input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Ej: Dermatología"
                                style={{
                                    ...inputStyle,
                                    ...(errors.name
                                        ? { borderColor: '#b91c1c' }
                                        : {}),
                                }}
                            />
                            {errors.name && (
                                <span
                                    style={{ color: '#b91c1c', fontSize: 12 }}
                                >
                                    {errors.name}
                                </span>
                            )}
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
                            <span>Precio de consulta (RD$) *</span>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: 36,
                                    border: `1px solid ${errors.consultation_price ? '#b91c1c' : '#e4e4e7'}`,
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                }}
                            >
                                <span
                                    style={{
                                        padding: '0 10px',
                                        color: '#71717a',
                                        fontSize: 13,
                                        flexShrink: 0,
                                    }}
                                >
                                    RD$
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.consultation_price}
                                    onChange={(e) =>
                                        setData(
                                            'consultation_price',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="0.00"
                                    style={{
                                        flex: 1,
                                        height: 34,
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        fontFamily: 'inherit',
                                        fontSize: 14,
                                        padding: '0 8px 0 0',
                                    }}
                                />
                            </div>
                            {errors.consultation_price && (
                                <span
                                    style={{ color: '#b91c1c', fontSize: 12 }}
                                >
                                    {errors.consultation_price}
                                </span>
                            )}
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
                            type="button"
                            onClick={onClose}
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
                            type="submit"
                            disabled={processing}
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
                                opacity: processing ? 0.7 : 1,
                            }}
                        >
                            ✓ Guardar
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ─── Doctor Modal ─────────────────────────────────────────────────────────────

type DoctorModalProps = {
    specialties: Specialty[];
    onClose: () => void;
    doctor?: Doctor | null;
    defaultSpecialtyId?: number | null;
};

function DoctorModal({
    specialties,
    onClose,
    doctor,
    defaultSpecialtyId,
}: DoctorModalProps) {
    const isEdit = Boolean(doctor);
    const { data, setData, post, put, transform, processing, errors } = useForm(
        {
            name: doctor?.name ?? '',
            exequatur: doctor?.exequatur ?? '',
            phone: doctor?.phone ?? '',
            specialty_id: String(
                doctor?.specialty_id ??
                    defaultSpecialtyId ??
                    specialties[0]?.id ??
                    '',
            ),
        },
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((form) => ({
            name: form.name,
            exequatur: form.exequatur || null,
            phone: form.phone || null,
            specialty_id: parseInt(form.specialty_id, 10),
        }));

        if (isEdit && doctor) {
            put(`/admin/doctores/${doctor.id}`, { onSuccess: onClose });
        } else {
            post('/admin/doctores', { onSuccess: onClose });
        }
    };

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 40,
                    background: 'rgba(0,0,0,.4)',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    zIndex: 41,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 480,
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
                        {isEdit ? 'Editar doctor' : 'Nuevo doctor'}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
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
                <form onSubmit={handleSubmit}>
                    <div
                        style={{
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
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
                            <span>Nombre completo *</span>
                            <input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Dr. / Dra."
                                style={{
                                    ...inputStyle,
                                    ...(errors.name
                                        ? { borderColor: '#b91c1c' }
                                        : {}),
                                }}
                            />
                            {errors.name && (
                                <span
                                    style={{ color: '#b91c1c', fontSize: 12 }}
                                >
                                    {errors.name}
                                </span>
                            )}
                        </label>
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
                                <span>No. de exequátur</span>
                                <input
                                    value={data.exequatur}
                                    onChange={(e) =>
                                        setData('exequatur', e.target.value)
                                    }
                                    placeholder="EX-000000"
                                    style={{
                                        ...inputStyle,
                                        fontFamily: 'ui-monospace,monospace',
                                        fontSize: 13,
                                        ...(errors.exequatur
                                            ? { borderColor: '#b91c1c' }
                                            : {}),
                                    }}
                                />
                                {errors.exequatur && (
                                    <span
                                        style={{
                                            color: '#b91c1c',
                                            fontSize: 12,
                                        }}
                                    >
                                        {errors.exequatur}
                                    </span>
                                )}
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
                                <span>Teléfono</span>
                                <MaskedInput
                                    mask="000-000-0000"
                                    value={data.phone ?? ''}
                                    onChange={(v) => setData('phone', v)}
                                    placeholder="809-000-0000"
                                    style={{
                                        ...inputStyle,
                                        ...(errors.phone
                                            ? { borderColor: '#b91c1c' }
                                            : {}),
                                    }}
                                />
                                {errors.phone && (
                                    <span
                                        style={{
                                            color: '#b91c1c',
                                            fontSize: 12,
                                        }}
                                    >
                                        {errors.phone}
                                    </span>
                                )}
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
                            <span>Especialidad *</span>
                            <select
                                value={data.specialty_id}
                                onChange={(e) =>
                                    setData('specialty_id', e.target.value)
                                }
                                style={{
                                    ...inputStyle,
                                    ...(errors.specialty_id
                                        ? { borderColor: '#b91c1c' }
                                        : {}),
                                    appearance: 'auto',
                                }}
                            >
                                {specialties.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            {errors.specialty_id && (
                                <span
                                    style={{ color: '#b91c1c', fontSize: 12 }}
                                >
                                    {errors.specialty_id}
                                </span>
                            )}
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
                            type="button"
                            onClick={onClose}
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
                            type="submit"
                            disabled={processing}
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
                                opacity: processing ? 0.7 : 1,
                            }}
                        >
                            ✓ Guardar doctor
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ─── Toggle Button ────────────────────────────────────────────────────────────

function ToggleButton({ doctor }: { doctor: Doctor }) {
    const { patch, processing } = useForm({});

    const handleToggle = () => {
        patch(`/admin/doctores/${doctor.id}/toggle`);
    };

    return (
        <button
            onClick={handleToggle}
            disabled={processing}
            style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 6,
                border: '1px solid #dfe7df',
                background: '#F6F9F5',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'inherit',
                opacity: processing ? 0.6 : 1,
            }}
        >
            {doctor.is_active ? 'Desactivar' : 'Activar'}
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DoctoresIndex() {
    const { specialties, doctors } = usePage<Props>().props;

    const [selEsp, setSelEsp] = useState<number | null>(
        specialties[0]?.id ?? null,
    );
    const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [editSpecialty, setEditSpecialty] = useState<Specialty | null>(null);
    const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);

    const filteredDoctors = selEsp
        ? doctors.filter((d) => d.specialty_id === selEsp)
        : [];
    const selectedSpecialty = specialties.find((s) => s.id === selEsp) ?? null;

    const openNewSpecialty = () => {
        setEditSpecialty(null);
        setShowSpecialtyModal(true);
    };

    const openEditSpecialty = (s: Specialty, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditSpecialty(s);
        setShowSpecialtyModal(true);
    };

    const openNewDoctor = () => {
        setEditDoctor(null);
        setShowDoctorModal(true);
    };

    const openEditDoctor = (d: Doctor) => {
        setEditDoctor(d);
        setShowDoctorModal(true);
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
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
                        Doctores y Especialidades
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#5f6b64' }}>
                        {specialties.length} especialidades · {doctors.length}{' '}
                        médicos registrados
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={openNewSpecialty}
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
                        + Nueva especialidad
                    </button>
                    <button
                        onClick={openNewDoctor}
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
                        + Nuevo doctor
                    </button>
                </div>
            </div>

            {/* Body */}
            <div
                style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                }}
            >
                {/* Specialty sidebar */}
                <div
                    style={{
                        flex: '0 0 240px',
                        minWidth: 200,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '.08em',
                            textTransform: 'uppercase',
                            color: '#56693f',
                            padding: '0 4px 4px',
                        }}
                    >
                        Especialidades
                    </div>

                    {specialties.length === 0 ? (
                        <p
                            style={{
                                color: '#71717a',
                                fontSize: 13,
                                padding: '8px 4px',
                            }}
                        >
                            No hay especialidades registradas.
                        </p>
                    ) : (
                        specialties.map((s) => {
                            const active = selEsp === s.id;
                            return (
                                <div
                                    key={s.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '10px 14px',
                                        borderRadius: 10,
                                        border: `1px solid ${active ? '#B9DC8E' : '#e3e9e3'}`,
                                        background: active ? '#EEF6E2' : '#fff',
                                        cursor: 'pointer',
                                        transition: 'background .15s',
                                        gap: 8,
                                    }}
                                    onClick={() => setSelEsp(s.id)}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontWeight: active ? 600 : 500,
                                                fontSize: 14,
                                                color: active
                                                    ? '#1f2d22'
                                                    : '#374151',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {s.name}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: '#71717a',
                                                marginTop: 2,
                                            }}
                                        >
                                            {fmt(s.consultation_price)} consulta
                                        </div>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: active
                                                ? '#2E8B3E'
                                                : '#a1a1aa',
                                            background: active
                                                ? '#D1FAE5'
                                                : '#F4F4F5',
                                            padding: '2px 7px',
                                            borderRadius: 999,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {s.doctors_count}
                                    </span>
                                    <button
                                        onClick={(e) => openEditSpecialty(s, e)}
                                        title="Editar especialidad"
                                        style={{
                                            flexShrink: 0,
                                            width: 26,
                                            height: 26,
                                            border: '1px solid #dfe7df',
                                            borderRadius: 6,
                                            background: active
                                                ? '#fff'
                                                : '#F6F9F5',
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#52525b',
                                        }}
                                    >
                                        ✏
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Doctors table */}
                <div
                    style={{
                        flex: '1 1 400px',
                        minWidth: 0,
                        background: '#fff',
                        border: '1px solid #e3e9e3',
                        borderRadius: 14,
                        overflow: 'hidden',
                    }}
                >
                    {!selectedSpecialty ? (
                        <div
                            style={{
                                padding: '48px 20px',
                                textAlign: 'center',
                                color: '#a1a1aa',
                            }}
                        >
                            <div style={{ fontSize: 32, marginBottom: 8 }}>
                                🏥
                            </div>
                            <div style={{ fontWeight: 500 }}>
                                Selecciona una especialidad
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Panel header */}
                            <div
                                style={{
                                    padding: '14px 20px',
                                    borderBottom: '1px solid #eef0ec',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
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
                                        {selectedSpecialty.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: '#5f6b64',
                                            marginTop: 2,
                                        }}
                                    >
                                        Consulta:{' '}
                                        <strong>
                                            {fmt(
                                                selectedSpecialty.consultation_price,
                                            )}
                                        </strong>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) =>
                                        openEditSpecialty(selectedSpecialty, e)
                                    }
                                    style={{
                                        height: 30,
                                        padding: '0 10px',
                                        borderRadius: 8,
                                        border: '1px solid #dfe7df',
                                        background: '#F6F9F5',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    ✏ Editar especialidad
                                </button>
                            </div>

                            {filteredDoctors.length === 0 ? (
                                <div
                                    style={{
                                        padding: '48px 20px',
                                        textAlign: 'center',
                                        color: '#a1a1aa',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 32,
                                            marginBottom: 8,
                                        }}
                                    >
                                        👨‍⚕️
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 500,
                                            marginBottom: 4,
                                        }}
                                    >
                                        Sin médicos asignados
                                    </div>
                                    <div style={{ fontSize: 13 }}>
                                        Agrega un doctor a esta especialidad
                                    </div>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table
                                        style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            minWidth: 580,
                                        }}
                                    >
                                        <thead>
                                            <tr>
                                                <th style={thStyle}>Nombre</th>
                                                <th style={thStyle}>
                                                    Exequátur
                                                </th>
                                                <th style={thStyle}>
                                                    Teléfono
                                                </th>
                                                <th style={thStyle}>Estado</th>
                                                <th
                                                    style={{
                                                        ...thStyle,
                                                        width: 80,
                                                    }}
                                                ></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDoctors.map((d) => (
                                                <tr
                                                    key={d.id}
                                                    style={{
                                                        opacity: d.is_active
                                                            ? 1
                                                            : 0.6,
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding: '12px',
                                                            borderBottom:
                                                                '1px solid #eef0ec',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 10,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    width: 34,
                                                                    height: 34,
                                                                    flexShrink: 0,
                                                                    borderRadius:
                                                                        '50%',
                                                                    background:
                                                                        '#DBEAFE',
                                                                    color: '#1E40AF',
                                                                    display:
                                                                        'inline-flex',
                                                                    alignItems:
                                                                        'center',
                                                                    justifyContent:
                                                                        'center',
                                                                    fontSize: 12,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {initials(
                                                                    d.name,
                                                                )}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontWeight: 500,
                                                                    fontSize: 14,
                                                                }}
                                                            >
                                                                {d.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: '12px',
                                                            borderBottom:
                                                                '1px solid #eef0ec',
                                                            fontFamily:
                                                                'ui-monospace,monospace',
                                                            fontSize: 12.5,
                                                            color: '#52525b',
                                                        }}
                                                    >
                                                        {d.exequatur ?? (
                                                            <span
                                                                style={{
                                                                    color: '#c4c9c4',
                                                                }}
                                                            >
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: '12px',
                                                            borderBottom:
                                                                '1px solid #eef0ec',
                                                            fontSize: 13,
                                                            color: '#52525b',
                                                        }}
                                                    >
                                                        {d.phone ?? (
                                                            <span
                                                                style={{
                                                                    color: '#c4c9c4',
                                                                }}
                                                            >
                                                                —
                                                            </span>
                                                        )}
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
                                                                padding:
                                                                    '3px 10px',
                                                                borderRadius: 999,
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                                background:
                                                                    d.is_active
                                                                        ? '#EEF6E2'
                                                                        : '#F4F4F5',
                                                                color: d.is_active
                                                                    ? '#2E8B3E'
                                                                    : '#52525B',
                                                            }}
                                                        >
                                                            {d.is_active
                                                                ? 'Activo'
                                                                : 'Inactivo'}
                                                        </span>
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: '12px',
                                                            borderBottom:
                                                                '1px solid #eef0ec',
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                gap: 6,
                                                                justifyContent:
                                                                    'flex-end',
                                                            }}
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    openEditDoctor(
                                                                        d,
                                                                    )
                                                                }
                                                                style={{
                                                                    height: 28,
                                                                    padding:
                                                                        '0 8px',
                                                                    borderRadius: 6,
                                                                    border: '1px solid #dfe7df',
                                                                    background:
                                                                        '#F6F9F5',
                                                                    cursor: 'pointer',
                                                                    fontSize: 12,
                                                                }}
                                                            >
                                                                ✏
                                                            </button>
                                                            <ToggleButton
                                                                key={d.id}
                                                                doctor={d}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Specialty modal */}
            {showSpecialtyModal && (
                <SpecialtyModal
                    key={editSpecialty?.id ?? 'new'}
                    specialty={editSpecialty}
                    onClose={() => {
                        setShowSpecialtyModal(false);
                        setEditSpecialty(null);
                    }}
                />
            )}

            {/* Doctor modal */}
            {showDoctorModal && (
                <DoctorModal
                    key={editDoctor?.id ?? 'new'}
                    specialties={specialties}
                    doctor={editDoctor}
                    defaultSpecialtyId={selEsp}
                    onClose={() => {
                        setShowDoctorModal(false);
                        setEditDoctor(null);
                    }}
                />
            )}
        </div>
    );
}
