import React from 'react';

// ─── AllergyAlert ─────────────────────────────────────────────────────────────

type Props = {
    medication: string;
};

export default function AllergyAlert({ medication }: Props) {
    return (
        <div
            role="alert"
            className="mx-[18px] mb-3 rounded-[10px] border border-error bg-error-bg px-[14px] py-[10px]"
        >
            <p className="m-0 text-[13px] font-semibold text-error">
                Alerta de alergia: «{medication}» coincide con una alergia
                registrada del paciente.
            </p>
        </div>
    );
}
