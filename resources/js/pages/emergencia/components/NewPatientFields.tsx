import React from 'react';
import FormField from '@/components/cemerog/FormField';
import SegmentedControl from '@/components/cemerog/SegmentedControl';

export type NewPatient = {
    identified: boolean;
    first_names: string;
    last_names: string;
    document_type: 'cedula' | 'pasaporte' | 'cedula_extranjera' | 'no_tiene';
    document_number: string;
    sex: 'M' | 'F' | '';
};

export const emptyNewPatient = (): NewPatient => ({
    identified: true,
    first_names: '',
    last_names: '',
    document_type: 'cedula',
    document_number: '',
    sex: '',
});

export function newPatientIsValid(p: NewPatient): boolean {
    const name =
        !p.identified ||
        (p.first_names.trim() !== '' && p.last_names.trim() !== '');
    const doc =
        p.document_type === 'no_tiene' || p.document_number.trim() !== '';
    return name && doc && p.sex !== '';
}

const check =
    'flex cursor-pointer items-center gap-2 text-[13.5px] text-text-secondary';

/** Minimum data of a patient not registered yet */
export default function NewPatientFields({
    value,
    errors,
    onChange,
}: {
    value: NewPatient;
    errors: Record<string, string>;
    onChange: (patch: Partial<NewPatient>) => void;
}) {
    const noDocument = value.document_type === 'no_tiene';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                {value.identified ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                            name="first_names"
                            label="Nombres"
                            value={value.first_names}
                            onChange={(e) =>
                                onChange({ first_names: e.target.value })
                            }
                            error={errors.first_names}
                            required
                        />
                        <FormField
                            name="last_names"
                            label="Apellidos"
                            value={value.last_names}
                            onChange={(e) =>
                                onChange({ last_names: e.target.value })
                            }
                            error={errors.last_names}
                            required
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-between rounded-[10px] border border-dashed border-input-border bg-list-row-bg px-3 py-2">
                        <span className="font-semibold text-text-heading">
                            N.N. · Sin identificar
                        </span>
                        <span className="text-[12px] text-muted">
                            Nombre temporal
                        </span>
                    </div>
                )}
                <label className={check}>
                    <input
                        type="checkbox"
                        checked={!value.identified}
                        onChange={(e) =>
                            onChange({ identified: !e.target.checked })
                        }
                    />
                    Paciente no identificado (inconsciente o sin acompañante)
                </label>
            </div>

            <div className="flex flex-col gap-2">
                {!noDocument && (
                    <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                        <FormField
                            as="select"
                            name="document_type"
                            label="Tipo de documento"
                            value={value.document_type}
                            onChange={(e) =>
                                onChange({
                                    document_type: e.target
                                        .value as NewPatient['document_type'],
                                })
                            }
                        >
                            <option value="cedula">Cédula</option>
                            <option value="pasaporte">Pasaporte</option>
                            <option value="cedula_extranjera">
                                Cédula extranjera
                            </option>
                        </FormField>
                        <FormField
                            name="document_number"
                            label="Documento"
                            placeholder="Cédula o pasaporte"
                            value={value.document_number}
                            onChange={(e) =>
                                onChange({ document_number: e.target.value })
                            }
                            error={errors.document_number}
                            required
                        />
                    </div>
                )}
                <label className={check}>
                    <input
                        type="checkbox"
                        checked={noDocument}
                        onChange={(e) =>
                            onChange({
                                document_type: e.target.checked
                                    ? 'no_tiene'
                                    : 'cedula',
                                document_number: '',
                            })
                        }
                    />
                    No trae documento
                </label>
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-[14px] font-medium text-text-heading">
                    Sexo <span className="text-error">*</span>
                </span>
                <SegmentedControl<'M' | 'F'>
                    segments={[
                        { value: 'M', label: 'Masculino' },
                        { value: 'F', label: 'Femenino' },
                    ]}
                    value={value.sex as 'M' | 'F'}
                    onChange={(sex) => onChange({ sex })}
                    className="self-start"
                />
                {errors.sex && (
                    <span className="text-xs text-error">{errors.sex}</span>
                )}
            </div>
        </div>
    );
}
