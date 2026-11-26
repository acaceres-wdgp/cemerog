/**
 * SearchSelect – a select you can type into: opens with every option, filters
 * as you type (by label or hint, ignoring accents and case) and is driven by
 * mouse or keyboard. For long lists such as products or suppliers.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export type SearchSelectOption = {
    value: string;
    label: string;
    /** Secondary text shown and searched too (a code, a presentation…) */
    hint?: string;
};

/** Rendering thousands of rows is slow; the user narrows by typing */
const MAX_VISIBLE = 50;

const normalize = (s: string) =>
    s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();

export default function SearchSelect({
    options,
    value,
    onChange,
    placeholder = 'Elegir…',
    action,
    id,
    invalid = false,
    className = '',
    'aria-label': ariaLabel,
}: {
    options: SearchSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /** Extra entry at the end of the list (e.g. «+ Crear producto nuevo…») */
    action?: { label: string; onSelect: () => void };
    id?: string;
    invalid?: boolean;
    className?: string;
    'aria-label'?: string;
}) {
    const listId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState<string | null>(null);
    const [active, setActive] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const selected = options.find((o) => o.value === value) ?? null;
    const terms = normalize(query ?? '')
        .split(/\s+/)
        .filter(Boolean);
    const matches = options.filter((o) => {
        const text = normalize(`${o.label} ${o.hint ?? ''}`);

        return terms.every((t) => text.includes(t));
    });
    const visible = matches.slice(0, MAX_VISIBLE);
    // Rows the keyboard moves through: the options, then the action
    const rowCount = visible.length + (action ? 1 : 0);

    const close = () => {
        setOpen(false);
        setQuery(null);
    };
    const pick = (index: number) => {
        if (index < visible.length) {
            onChange(visible[index].value);
        } else if (action) {
            action.onSelect();
        }
        close();
    };
    const openList = () => {
        if (open) return;
        setOpen(true);
        const current = visible.findIndex((o) => o.value === value);
        setActive(current >= 0 ? current : 0);
    };

    // The list floats over the page so a scrolling table does not clip it
    useLayoutEffect(() => {
        if (!open) return;
        const update = () =>
            setRect(inputRef.current?.getBoundingClientRect() ?? null);
        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);

        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [open]);

    // Keep the highlighted row in view while moving with the keyboard
    useEffect(() => {
        if (!open) return;
        document
            .getElementById(`${listId}-${active}`)
            ?.scrollIntoView?.({ block: 'nearest' });
    }, [active, open, listId]);

    return (
        <div className={`relative ${className}`}>
            <input
                ref={inputRef}
                id={id}
                role="combobox"
                aria-label={ariaLabel}
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                    open && rowCount > 0 ? `${listId}-${active}` : undefined
                }
                autoComplete="off"
                placeholder={selected ? selected.label : placeholder}
                value={query ?? selected?.label ?? ''}
                onFocus={(e) => {
                    e.target.select();
                    openList();
                }}
                onClick={openList}
                onBlur={close}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                    setOpen(true);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (!open) return openList();
                        if (rowCount === 0) return;
                        const step = e.key === 'ArrowDown' ? 1 : -1;
                        setActive((a) => (a + step + rowCount) % rowCount);
                    } else if (e.key === 'Enter' && open) {
                        e.preventDefault();
                        if (rowCount > 0) pick(active);
                    } else if (e.key === 'Escape' && open) {
                        e.preventDefault();
                        close();
                    }
                }}
                className={`h-9 w-full rounded-lg border bg-white pr-8 pl-2 text-[14px] text-text-body outline-none placeholder:text-muted focus:border-primary ${
                    invalid ? 'border-error-border' : 'border-input-border'
                }`}
            />
            <ChevronDown
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            {open &&
                createPortal(
                    <ul
                        id={listId}
                        role="listbox"
                        aria-label={ariaLabel}
                        // Clicking a row must not blur the input first
                        onMouseDown={(e) => e.preventDefault()}
                        className="fixed z-50 max-h-72 overflow-y-auto rounded-lg border border-card-border bg-white py-1 text-[14px] shadow-lg"
                        // dynamic-style: follows the input's position on screen
                        style={{
                            top: (rect?.bottom ?? 0) + 4,
                            left: rect?.left ?? 0,
                            width: Math.max(rect?.width ?? 0, 260),
                        }}
                    >
                        {visible.map((o, i) => (
                            <li
                                key={o.value}
                                id={`${listId}-${i}`}
                                role="option"
                                aria-selected={o.value === value}
                                onMouseDown={() => pick(i)}
                                onMouseEnter={() => setActive(i)}
                                className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-1.5 ${
                                    i === active ? 'bg-accent-bg' : ''
                                } ${o.value === value ? 'font-semibold' : ''}`}
                            >
                                <span className="text-text-body">
                                    {o.label}
                                </span>
                                {o.hint && (
                                    <span className="shrink-0 font-mono text-[12px] text-muted">
                                        {o.hint}
                                    </span>
                                )}
                            </li>
                        ))}
                        {visible.length === 0 && (
                            <li className="px-3 py-1.5 text-muted">
                                Sin resultados
                            </li>
                        )}
                        {matches.length > MAX_VISIBLE && (
                            <li className="px-3 py-1.5 text-[12.5px] text-muted">
                                {matches.length - MAX_VISIBLE} más · sigue
                                escribiendo para filtrar
                            </li>
                        )}
                        {action && (
                            <li
                                id={`${listId}-${visible.length}`}
                                role="option"
                                aria-selected={false}
                                onMouseDown={() => pick(visible.length)}
                                onMouseEnter={() => setActive(visible.length)}
                                className={`cursor-pointer border-t border-divider px-3 py-1.5 font-semibold text-primary ${
                                    active === visible.length
                                        ? 'bg-accent-bg'
                                        : ''
                                }`}
                            >
                                {action.label}
                            </li>
                        )}
                    </ul>,
                    document.body,
                )}
        </div>
    );
}
