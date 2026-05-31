import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import StatsBar from '../src/components/StatsBar';

afterEach(() => cleanup());

describe('StatsBar', () => {
    const stats = { total: 30, learned: 5, due: 12 };

    it('отображает числа', () => {
        render(<StatsBar stats={stats} />);
        expect(screen.getByText('30')).toBeTruthy();
        expect(screen.getByText('5')).toBeTruthy();
        expect(screen.getByText('12')).toBeTruthy();
    });
});