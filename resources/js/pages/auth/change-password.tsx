import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/cemerog/PasswordInput';

type ChangePasswordForm = {
    password: string;
    password_confirmation: string;
};

export default function ChangePassword() {
    const { data, setData, post, processing, errors } =
        useForm<ChangePasswordForm>({
            password: '',
            password_confirmation: '',
        });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/password/change-required');
    };

    return (
        <>
            <Head title="Cambiar contraseña" />

            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F3F7F2] px-4">
                <div className="w-full max-w-sm">
                    <div className="mb-8 text-center">
                        <h1
                            className="text-3xl font-bold text-[#2E8B3E]"
                            style={{ fontFamily: 'Bitter, serif' }}
                        >
                            CEMEROG
                        </h1>
                        <p className="mt-1 text-sm text-[#71717a]">
                            Dres. Rodríguez &amp; Guzmán
                        </p>
                    </div>

                    <div className="rounded-xl border border-[#e3e9e3] bg-white p-8 shadow-sm">
                        <h2 className="mb-2 text-center text-base font-semibold text-[#1f2d22]">
                            Cambiar contraseña
                        </h2>
                        <p className="mb-6 text-center text-sm text-[#71717a]">
                            Debes establecer una nueva contraseña para
                            continuar.
                        </p>

                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-medium text-[#1f2d22]"
                                >
                                    Nueva contraseña{' '}
                                    <span className="text-[#b91c1c]">*</span>
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    error={errors.password}
                                    showGenerator
                                    onGenerate={(pwd) =>
                                        setData('password', pwd)
                                    }
                                />
                                {errors.password && (
                                    <p
                                        className="text-xs text-[#b91c1c]"
                                        role="alert"
                                    >
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-sm font-medium text-[#1f2d22]"
                                >
                                    Confirmar contraseña{' '}
                                    <span className="text-[#b91c1c]">*</span>
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    error={errors.password_confirmation}
                                />
                                {errors.password_confirmation && (
                                    <p
                                        className="text-xs text-[#b91c1c]"
                                        role="alert"
                                    >
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-9 w-full"
                                disabled={processing}
                                style={{ backgroundColor: '#2E8B3E' }}
                            >
                                {processing
                                    ? 'Guardando...'
                                    : 'Establecer contraseña'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
