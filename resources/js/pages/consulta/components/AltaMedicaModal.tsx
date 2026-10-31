import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import ConfirmDialog from '@/components/cemerog/ConfirmDialog';
import { cn } from '@/lib/utils';
import consulta from '@/routes/consulta';
import { TurnItem } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type DischargeType = 'recuperado' | 'traslado' | 'defuncion';

interface AltaMedicaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    turn: TurnItem;
    onDischargeSuccess?: () => void;
}

// ─── Option Card ──────────────────────────────────────────────────────────────

function OptionCard({
    selected,
    onClick,
    title,
    description,
}: {
    selected: boolean;
    onClick: () => void;
    title: string;
    description: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'w-full cursor-pointer rounded-[10px] border-2 p-4 text-left transition-colors',
                selected
                    ? 'border-primary bg-accent-bg'
                    : 'border-card-border bg-white hover:border-secondary-border',
            )}
        >
            <div className="font-semibold text-text-heading">{title}</div>
            <div className="mt-1 text-[13px] text-muted">{description}</div>
        </button>
    );
}

// ─── Alta Médica Modal ────────────────────────────────────────────────────────

export default function AltaMedicaModal({
    open,
    onOpenChange,
    turn,
    onDischargeSuccess,
}: AltaMedicaModalProps) {
    const pageErrors = usePage().props.errors as
        | Partial<{
              type: string;
              destination: string;
              discharge_diagnosis: string;
              message: string;
          }>
        | undefined;

    const [dischargeType, setDischargeType] =
        useState<DischargeType>('recuperado');
    const [destination, setDestination] = useState('');
    const [reason, setReason] = useState('A petición del familiar');
    const [dischargeDiagnosis, setDischargeDiagnosis] = useState('');
    const [showDefuncionConfirm, setShowDefuncionConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const turnLabel = `T-${String(turn.turn_number).padStart(2, '0')}`;

    const handleOpenChange = (value: boolean) => {
        if (!value) {
            // Reset state on close
            setDischargeType('recuperado');
            setDestination('');
            setReason('A petición del familiar');
            setDischargeDiagnosis('');
            setShowDefuncionConfirm(false);
        }
        onOpenChange(value);
    };

    const submitDischarge = () => {
        setIsLoading(true);
        router.post(
            consulta.discharge.url(turn.id),
            {
                type: dischargeType,
                destination: dischargeType === 'traslado' ? destination : null,
                reason: dischargeType === 'traslado' ? reason : null,
                discharge_diagnosis: dischargeDiagnosis,
            },
            {
                onFinish: () => setIsLoading(false),
                onSuccess: () => {
                    onOpenChange(false);
                    onDischargeSuccess?.();
                },
            },
        );
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (dischargeType === 'defuncion') {
            setShowDefuncionConfirm(true);
        } else {
            submitDischarge();
        }
    };

    return (
        <>
            <FormDialog
                open={open}
                onOpenChange={handleOpenChange}
                title="Alta médica"
                description={`${turn.patient.full_name} · Turno ${turnLabel}`}
                submitLabel="Confirmar alta"
                cancelLabel="Cancelar"
                onSubmit={handleSubmit}
                isLoading={isLoading}
                maxWidth="sm:max-w-lg"
            >
                <div className="flex flex-col gap-4">
                    {/* Duplicate discharge error */}
                    {pageErrors?.message && (
                        <p className="text-xs text-error" role="alert">
                            {pageErrors.message}
                        </p>
                    )}

                    {/* Type selection */}
                    <div className="flex flex-col gap-2">
                        <OptionCard
                            selected={dischargeType === 'recuperado'}
                            onClick={() => setDischargeType('recuperado')}
                            title="Por alivio"
                            description="El paciente mejora y regresa a su hogar."
                        />
                        <OptionCard
                            selected={dischargeType === 'traslado'}
                            onClick={() => setDischargeType('traslado')}
                            title="Traslado a otro centro"
                            description="A petición del familiar."
                        />
                        <OptionCard
                            selected={dischargeType === 'defuncion'}
                            onClick={() => setDischargeType('defuncion')}
                            title="Defunción"
                            description="Requiere confirmación."
                        />
                        {pageErrors?.type && (
                            <span className="text-xs text-error" role="alert">
                                {pageErrors.type}
                            </span>
                        )}
                    </div>

                    {/* Destination field – only for traslado */}
                    {dischargeType === 'traslado' && (
                        <label className="flex flex-col gap-1">
                            <span className="text-[13px] font-medium text-text-heading">
                                Centro de destino
                            </span>
                            <input
                                type="text"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                required
                                placeholder="Nombre del centro"
                                className={cn(
                                    'h-9 rounded-[8px] border bg-white px-3 text-sm outline-none focus:border-primary',
                                    pageErrors?.destination
                                        ? 'border-error-border'
                                        : 'border-secondary-border',
                                )}
                                aria-label="Centro de destino"
                            />
                            {pageErrors?.destination && (
                                <span
                                    className="text-xs text-error"
                                    role="alert"
                                >
                                    {pageErrors.destination}
                                </span>
                            )}
                        </label>
                    )}

                    {/* Discharge diagnosis */}
                    <label className="flex flex-col gap-1">
                        <span className="text-[13px] font-medium text-text-heading">
                            Diagnóstico de egreso
                        </span>
                        <textarea
                            value={dischargeDiagnosis}
                            onChange={(e) =>
                                setDischargeDiagnosis(e.target.value)
                            }
                            required
                            rows={3}
                            placeholder="Diagnóstico al momento del egreso"
                            className={cn(
                                'rounded-[8px] border bg-white px-3 py-2 text-sm outline-none focus:border-primary',
                                pageErrors?.discharge_diagnosis
                                    ? 'border-error-border'
                                    : 'border-secondary-border',
                            )}
                            aria-label="Diagnóstico de egreso"
                        />
                        {pageErrors?.discharge_diagnosis && (
                            <span className="text-xs text-error" role="alert">
                                {pageErrors.discharge_diagnosis}
                            </span>
                        )}
                    </label>
                </div>
            </FormDialog>

            {/* Second confirmation for defuncion */}
            <ConfirmDialog
                open={showDefuncionConfirm}
                onOpenChange={setShowDefuncionConfirm}
                title="Confirmar defunción"
                description={`Confirmo la defunción del paciente ${turn.patient.full_name}. Esta acción no se puede deshacer.`}
                confirmLabel="Confirmar defunción"
                cancelLabel="Cancelar"
                variant="destructive"
                isLoading={isLoading}
                onConfirm={submitDischarge}
            />
        </>
    );
}
