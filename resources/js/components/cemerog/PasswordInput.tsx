/**
 * PasswordInput – input with show/hide toggle and optional password generator.
 */

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

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
        { error, showGenerator = false, onGenerate, className = '', ...props },
        ref,
    ) => {
        const [show, setShow] = useState(false);

        const handleGenerate = () => {
            const password = generatePassword();
            onGenerate?.(password);
        };

        return (
            <div className="relative flex items-center">
                <input
                    ref={ref}
                    type={show ? 'text' : 'password'}
                    className={`w-full rounded-md border px-3 py-2 pr-10 text-sm text-[#333333] transition-colors placeholder:text-[#71717a] focus:border-[#2E8B3E] focus:ring-2 focus:ring-[#2E8B3E] focus:outline-none ${
                        error
                            ? 'border-[#fecaca] bg-[#fef2f2]'
                            : 'border-[#e4e4e7] bg-white'
                    } ${showGenerator ? 'pr-20' : 'pr-10'} ${className}`}
                    {...props}
                />
                {showGenerator && (
                    <button
                        type="button"
                        onClick={handleGenerate}
                        className="absolute right-8 p-1 text-[#71717a] transition-colors hover:text-[#2E8B3E]"
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
                    className="absolute right-2 p-1 text-[#71717a] transition-colors hover:text-[#2E8B3E]"
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
