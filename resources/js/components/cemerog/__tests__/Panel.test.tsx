import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Panel from '../Panel';

describe('Panel', () => {
    it('renders children', () => {
        const { getByText } = render(<Panel>Content</Panel>);
        expect(getByText('Content')).toBeTruthy();
    });

    it('renders title and description in header', () => {
        const { getByText } = render(
            <Panel title="My Title" description="My Description">
                Content
            </Panel>,
        );
        expect(getByText('My Title')).toBeTruthy();
        expect(getByText('My Description')).toBeTruthy();
    });

    it('applies shadow by default', () => {
        const { container } = render(<Panel>Content</Panel>);
        const div = container.firstChild as HTMLElement;
        expect(div.className).toContain('shadow-');
    });

    it('noShadow omits the shadow class', () => {
        const { container } = render(<Panel noShadow>Content</Panel>);
        const div = container.firstChild as HTMLElement;
        expect(div.className).not.toContain('shadow-');
    });

    it('noPadding skips the p-5 class on body', () => {
        const { container } = render(<Panel noPadding>Content</Panel>);
        const body = container.querySelector('.p-5');
        expect(body).toBeNull();
    });

    it('accepts additional className', () => {
        const { container } = render(
            <Panel className="overflow-hidden">Content</Panel>,
        );
        const div = container.firstChild as HTMLElement;
        expect(div.className).toContain('overflow-hidden');
    });
});
