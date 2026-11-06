/**
 * PasswordInput – input with show/hide toggle and optional password generator.
 * Built on ui/input so it looks exactly like the other inputs.
 */

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    showGenerator?: boolean;
    onGenerate?: (password: string) => void;
}

function generatePassword(length = 16): string {
    const chars =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    return Array.from(
        { length },
        () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    (
        { error, showGenerator = false, onGenerate, className, ...props },
        ref,
    ) => {
        const [show, setShow] = useState(false);

        const handleGenerate = () => {
            const password = generatePassword();
            onGenerate?.(password);
        };

        return (
            <div className="relative flex items-center">
                <Input
                    ref={ref}
                    type={show ? 'text' : 'password'}
                    aria-invalid={error ? true : undefined}
                    className={cn(
                        showGenerator ? 'pr-20' : 'pr-10',
                        error && 'border-error-border bg-error-bg',
                        className,
                    )}
                    {...props}
                />
                {showGenerator && (
                    <button
                        type="button"
                        onClick={handleGenerate}
                        className="absolute right-8 p-1 text-muted transition-colors hover:text-primary"
                        tabIndex={-1}
                        title="Generar contraseña"
                        aria-label="Generar contraseña segura"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-2 p-1 text-muted transition-colors hover:text-primary"
                    tabIndex={-1}
                    aria-label={
                        show ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                >
                    {show ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>
        );
    },
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
