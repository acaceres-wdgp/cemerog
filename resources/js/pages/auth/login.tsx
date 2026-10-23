import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import PasswordInput from '@/components/cemerog/PasswordInput';

type LoginForm = {
    username: string;
    password: string;
    remember: boolean;
};

type Props = {
    status?: string;
};

export default function Login({ status }: Props) {
    const { data, setData, post, processing, errors: formErrors } = useForm<LoginForm>({
        username: '',
        password: '',
        remember: false,
    });

    // Errors flashed by a redirect (e.g. a deactivated account) arrive as page props
    const pageErrors = usePage().props.errors as Partial<Record<keyof LoginForm, string>>;
    const errors = { ...pageErrors, ...formErrors };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/login', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Iniciar sesión" />

            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F3F7F2] px-4">
                <div className="w-full max-w-sm">
                    {/* Logo */}
                    <div className="mb-8 text-center">
                        <h1
                            className="text-3xl font-bold text-[#2E8B3E]"
                            style={{ fontFamily: 'Bitter, serif' }}
                        >
                            CEMEROG
                        </h1>
                        <p className="mt-1 text-sm text-[#71717a]">Dres. Rodríguez &amp; Guzmán</p>
                    </div>

                    <div className="rounded-xl border border-[#e3e9e3] bg-white p-8 shadow-sm">
                        <h2 className="mb-6 text-center text-base font-semibold text-[#1f2d22]">
                            Iniciar sesión
                        </h2>

                        {status && (
                            <div className="mb-4 rounded-lg bg-[#EEF6E2] border border-[#8CC63F] px-4 py-3 text-sm text-[#2f4a17]">
                                {status}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="username" className="text-sm font-medium text-[#1f2d22]">
                                    Usuario
                                </Label>
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoFocus
                                    autoComplete="username"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="nombre.usuario"
                                    className="h-9"
                                />
                                {errors.username && (
                                    <p className="text-xs text-[#b91c1c]" role="alert">{errors.username}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="password" className="text-sm font-medium text-[#1f2d22]">
                                    Contraseña
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                />
                                {errors.password && (
                                    <p className="text-xs text-[#b91c1c]" role="alert">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="remember"
                                    checked={data.remember}
                                    onCheckedChange={(v) => setData('remember', Boolean(v))}
                                />
                                <Label htmlFor="remember" className="text-sm text-[#71717a] cursor-pointer">
                                    Recuérdame
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-9 w-full"
                                disabled={processing}
                                style={{ backgroundColor: '#2E8B3E' }}
                                data-test="login-button"
                            >
                                {processing ? 'Iniciando sesión...' : 'Iniciar sesión'}
                            </Button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-xs text-[#71717a]">
                        &copy; {new Date().getFullYear()} CEMEROG. Sistema de gestión clínica.
                    </p>
                </div>
            </div>
        </>
    );
}
