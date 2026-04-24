import './RatingButtons.css';

const ratings = [
    { quality: 0, label: 'Сложно', emoji: '🔴', className: 'again' },
    { quality: 2, label: 'Не очень', emoji: '🟡', className: 'hard' },
    { quality: 4, label: 'Хорошо', emoji: '🟢', className: 'good' },
    { quality: 5, label: 'Отлично', emoji: '⭐', className: 'easy' },
];

export default function RatingButtons({ onRate }) {
    return (
        <div className="rating-buttons">
            <p className="rating-label">Насколько хорошо помните?</p>
            <div className="rating-grid">
                {ratings.map(({ quality, label, emoji, className }) => (
                    <button
                        key={quality}
                        onClick={() => onRate(quality)}
                        className={`rate-btn ${className}`}
                    >
                        <span className="rate-emoji">{emoji}</span>
                        <span className="rate-label">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}