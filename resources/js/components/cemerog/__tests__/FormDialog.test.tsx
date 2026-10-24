import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import FormDialog from '../FormDialog';

describe('FormDialog', () => {
    afterEach(() => {
        cleanup();
    });

    function renderOpen() {
        render(
            <FormDialog open={true} onOpenChange={() => {}} title="Test Dialog">
                <p>Content</p>
            </FormDialog>,
        );
    }

    it('card has bg-card-bg background', () => {
        renderOpen();
        const content = document.querySelector('[role="dialog"]');
        expect(content?.className).toContain('bg-card-bg');
    });

    it('card has rounded-[14px] radius', () => {
        renderOpen();
        const content = document.querySelector('[role="dialog"]');
        expect(content?.className).toContain('rounded-[14px]');
    });

    it('overlay has bg-overlay class', () => {
        renderOpen();
        const overlay = document.querySelector(
            '[data-state="open"][class*="bg-overlay"]',
        );
        expect(overlay?.className).toContain('bg-overlay');
    });
});
