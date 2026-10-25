import type { PatientSearchResult } from '@/types/patient';

interface PatientInfoCardProps {
    patient: PatientSearchResult;
}

export function PatientInfoCard({ patient }: PatientInfoCardProps) {
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
                    padding: '16px 20px',
                    borderBottom: '1px solid #eef0ec',
                    fontFamily: 'Bitter,Georgia,serif',
                    fontWeight: 600,
                    fontSize: 16,
                    color: '#1f2d22',
                }}
            >
                Paciente
            </div>
            <div
                style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                    }}
                >
                    <span
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: '#EEF6E2',
                            color: '#2f4a17',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 14,
                        }}
                    >
                        {patient.initials}
                    </span>
                    <div>
                        <div
                            style={{
                                fontWeight: 600,
                                color: '#1f2d22',
                            }}
                        >
                            {patient.full_name}
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                color: '#71717a',
                            }}
                        >
                            {patient.age} años ·{' '}
                            {patient.sex === 'F' ? 'Femenino' : 'Masculino'}
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: '6px 12px',
                        fontSize: 13,
                    }}
                >
                    <span style={{ color: '#71717a' }}>Documento</span>
                    <span style={{ textAlign: 'right' }}>
                        {patient.document_number}
                    </span>
                    <span style={{ color: '#71717a' }}>Sangre</span>
                    <span style={{ textAlign: 'right' }}>
                        {patient.blood_type ?? '—'}
                    </span>
                    <span style={{ color: '#71717a' }}>Alergias</span>
                    <span
                        style={{
                            textAlign: 'right',
                            color: patient.allergies ? '#b91c1c' : '#c4c9c4',
                        }}
                    >
                        {patient.allergies ?? 'Ninguna'}
                    </span>
                </div>
            </div>
        </div>
    );
}
