/**
 * FormField – label + input/textarea/select + error message + optional help text.
 */

import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface FormFieldBaseProps {
    label: string;
    name: string;
    error?: string;
    help?: string;
    required?: boolean;
    className?: string;
    children?: ReactNode;
}

interface InputFieldProps extends FormFieldBaseProps, InputHTMLAttributes<HTMLInputElement> {
    as?: 'input';
}

interface TextareaFieldProps extends FormFieldBaseProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
    as: 'textarea';
}

interface SelectFieldProps extends FormFieldBaseProps, SelectHTMLAttributes<HTMLSelectElement> {
    as: 'select';
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, FormFieldProps>(
    ({ label, name, error, help, required, className = '', as: Component = 'input', children, ...rest }, ref) => {
        const inputClasses = `w-full rounded-md border px-3 py-2 text-sm text-[#333333] placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#2E8B3E] focus:border-[#2E8B3E] transition-colors ${
            error
                ? 'border-[#fecaca] bg-[#fef2f2]'
                : 'border-[#e4e4e7] bg-white'
        }`;

        return (
            <div className={`flex flex-col gap-1.5 ${className}`}>
                <label htmlFor={name} className="text-sm font-medium text-[#1f2d22]">
                    {label}
                    {required && <span className="ml-1 text-[#b91c1c]">*</span>}
                </label>

                {Component === 'textarea' ? (
                    <textarea
                        id={name}
                        name={name}
                        className={inputClasses}
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    />
                ) : Component === 'select' ? (
                    <select
                        id={name}
                        name={name}
                        className={inputClasses}
                        ref={ref as React.Ref<HTMLSelectElement>}
                        {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}
                    >
                        {children}
                    </select>
                ) : (
                    <input
                        id={name}
                        name={name}
                        className={inputClasses}
                        ref={ref as React.Ref<HTMLInputElement>}
                        {...(rest as InputHTMLAttributes<HTMLInputElement>)}
                    />
                )}

                {error && (
                    <p className="text-xs text-[#b91c1c]" role="alert">{error}</p>
                )}
                {help && !error && (
                    <p className="text-xs text-[#71717a]">{help}</p>
                )}
            </div>
        );
    },
);

FormField.displayName = 'FormField';

export default FormField;
