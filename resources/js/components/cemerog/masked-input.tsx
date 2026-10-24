/**
 * MaskedInput — controlled input that auto-formats digits according to a mask.
 *
 * Mask format: '0' = digit slot, any other character = literal separator.
 * Examples:
 *   cedula:  '000-0000000-0'
 *   phone:   '000-000-0000'
 *
 * The formatted value (with separators) is what gets stored and submitted.
 */

type Props = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value'
> & {
    mask: string;
    value: string;
    onChange: (formatted: string) => void;
};

function digitSlots(mask: string): number {
    return mask.split('').filter((c) => c === '0').length;
}

function applyMask(digits: string, mask: string): string {
    let result = '';
    let di = 0;
    for (let i = 0; i < mask.length && di < digits.length; i++) {
        result += mask[i] === '0' ? digits[di++] : mask[i];
    }
    return result;
}

function stripToDigits(value: string): string {
    return value.replace(/\D/g, '');
}

export function MaskedInput({ mask, value, onChange, ...rest }: Props) {
    const maxDigits = digitSlots(mask);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = stripToDigits(e.target.value).slice(0, maxDigits);
        onChange(applyMask(digits, mask));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            const digits = stripToDigits(value);
            if (digits.length > 0) {
                e.preventDefault();
                onChange(applyMask(digits.slice(0, -1), mask));
            }
        }
    };

    const placeholder = rest.placeholder ?? mask.replace(/0/g, '_');

    return (
        <input
            {...rest}
            inputMode="numeric"
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
        />
    );
}
