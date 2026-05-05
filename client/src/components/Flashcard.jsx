import './Flashcard.css';

export default function Flashcard({ word, showAnswer, onClick }) {
    return (
        <div className="flashcard" onClick={onClick}>
            <div className="flashcard-inner">
                <div className="word-display">
                    {showAnswer ? word.translation : word.word}
                </div>

                {showAnswer && word.example && (
                    <div className="example-block">
                        <div className="example-original">
                            💬 {word.example}
                        </div>
                        {word.example_translation && (
                            <div className="example-translation">
                                🇷🇺 {word.example_translation}
                            </div>
                        )}
                    </div>
                )}

                <div className="category-badge">
                    {getCategoryEmoji(word.category)} {getCategoryName(word.category)}
                </div>

                <div className="click-hint">
                    {showAnswer ? 'Нажмите, чтобы скрыть' : 'Нажмите, чтобы увидеть перевод'}
                </div>
            </div>

            {!showAnswer && (
                <div className="level-indicator">
                    {'⭐'.repeat(Math.min(word.level, 5))}
                </div>
            )}
        </div>
    );
}

function getCategoryEmoji(category) {
    const emojis = {
        basics: '📝',
        food: '🍽️',
        travel: '✈️',
        work: '💼',
        hobbies: '🎨'
    };
    return emojis[category] || '📚';
}

function getCategoryName(category) {
    const names = {
        basics: 'Основы',
        food: 'Еда',
        travel: 'Путешествия',
        work: 'Работа',
        hobbies: 'Хобби'
    };
    return names[category] || category;
}