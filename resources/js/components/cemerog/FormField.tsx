/**
 * FormField – label + input/textarea/select + error message + optional help text.
 */

import {
    InputHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
    forwardRef,
} from 'react';

interface FormFieldBaseProps {
    label: string;
    name: string;
    error?: string;
    help?: string;
    required?: boolean;
    className?: string;
    children?: ReactNode;
}

// HTML attributes minus the keys FormField defines itself
type HtmlProps<T> = Omit<T, keyof FormFieldBaseProps>;

interface InputFieldProps
    extends
        FormFieldBaseProps,
        HtmlProps<InputHTMLAttributes<HTMLInputElement>> {
    as?: 'input';
}

interface TextareaFieldProps
    extends
        FormFieldBaseProps,
        HtmlProps<TextareaHTMLAttributes<HTMLTextAreaElement>> {
    as: 'textarea';
}

interface SelectFieldProps
    extends
        FormFieldBaseProps,
        HtmlProps<SelectHTMLAttributes<HTMLSelectElement>> {
    as: 'select';
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

const FormField = forwardRef<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    FormFieldProps
>(
    (
        {
            label,
            name,
            error,
            help,
            required,
            className = '',
            as: Component = 'input',
            children,
            ...rest
        },
        ref,
    ) => {
        const inputClasses = `w-full rounded-md border px-3 py-2 text-sm text-text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
            error
                ? 'border-error-border bg-error-bg'
                : 'border-input-border bg-white'
        }`;

        return (
            <div className={`flex flex-col gap-1.5 ${className}`}>
                <label
                    htmlFor={name}
                    className="text-sm font-medium text-text-heading"
                >
                    {label}
                    {required && <span className="ml-1 text-error">*</span>}
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
                    <p className="text-xs text-error" role="alert">
                        {error}
                    </p>
                )}
                {help && !error && (
                    <p className="text-xs text-muted">{help}</p>
                )}
            </div>
        );
    },
);

FormField.displayName = 'FormField';

export default FormField;
