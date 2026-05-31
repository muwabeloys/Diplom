import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Flashcard from '../src/components/Flashcard';

afterEach(() => cleanup());

describe('Flashcard Component', () => {
    const word = { id: 1, word: 'Hello', translation: 'Привет', example: 'Hi!', example_translation: 'Привет!', category: 'basics', level: 2 };

    it('показывает слово', () => {
        render(<Flashcard word={word} showAnswer={false} onClick={() => { }} />);
        expect(screen.getByText('Hello')).toBeTruthy();
    });

    it('показывает перевод', () => {
        render(<Flashcard word={word} showAnswer={true} onClick={() => { }} />);
        expect(screen.getByText('Привет')).toBeTruthy();
    });

    it('вызывает onClick', () => {
        let clicked = false;
        render(<Flashcard word={word} showAnswer={false} onClick={() => clicked = true} />);
        fireEvent.click(screen.getByText('Hello'));
        expect(clicked).toBe(true);
    });
});