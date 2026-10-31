import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SegmentedControl from '../SegmentedControl';

describe('SegmentedControl', () => {
    it('does not submit the form it is in', () => {
        const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
        const onChange = vi.fn();
        render(
            <form onSubmit={onSubmit}>
                <SegmentedControl
                    segments={[
                        { value: 'a', label: 'A' },
                        { value: 'b', label: 'B' },
                    ]}
                    value="a"
                    onChange={onChange}
                />
            </form>,
        );

        fireEvent.click(screen.getByRole('tab', { name: 'B' }));
        expect(onChange).toHaveBeenCalledWith('b');
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
