import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RatingButtons from '../src/components/RatingButtons';

afterEach(() => cleanup());

describe('RatingButtons', () => {
    it('отображает кнопки', () => {
        render(<RatingButtons onRate={() => { }} />);
        expect(screen.getByText('Сложно')).toBeTruthy();
        expect(screen.getByText('Отлично')).toBeTruthy();
    });

    it('вызывает onRate с 5', () => {
        const fn = vi.fn();
        render(<RatingButtons onRate={fn} />);
        fireEvent.click(screen.getByText('Отлично'));
        expect(fn).toHaveBeenCalledWith(5);
    });
});