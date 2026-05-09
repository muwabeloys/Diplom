import { useState, useEffect } from 'react';
import { api } from '../api/client';
import './ProfilePage.css';

const categoryNames = {
    basics: '📝 Основы',
    food: '🍽️ Еда',
    travel: '✈️ Путешествия',
    work: '💼 Работа',
    hobbies: '🎨 Хобби'
};

const levelNames = {
    0: 'Новые',
    1: 'Начал',
    2: 'Учу',
    3: 'Знаю',
    4: 'Хорошо',
    5: 'Отлично'
};

const levelColors = {
    0: '#e0e0e0',
    1: '#ffa502',
    2: '#ffa502',
    3: '#2ed573',
    4: '#2ed573',
    5: '#3742fa'
};

export default function ProfilePage({ onBack }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await api.getProfile();
            setProfile(data.user);
        } catch (err) {
            console.error('Error loading profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="loading">Загрузка...</div>
            </div>
        );
    }

    if (!profile) return null;

    const { stats } = profile;

    return (
        <div className="profile-page">
            <header className="profile-header">
                <button onClick={onBack} className="btn-back">← Назад</button>
                <h1>👤 {profile.username}</h1>
            </header>

            <div className="profile-content">
                {/* Прогресс */}
                <div className="card overall-progress">
                    <h2>📊 Прогресс обучения</h2>
                    <div className="progress-circle-container">
                        <div className="progress-circle">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="8" />
                                <circle
                                    cx="50" cy="50" r="45"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${stats.completion_percent * 2.83} 283`}
                                    transform="rotate(-90 50 50)"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#667eea" />
                                        <stop offset="100%" stopColor="#764ba2" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="progress-text">
                                <span className="percent">{stats.completion_percent}%</span>
                                <span className="label">изучено</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Быстрая статистика */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📚</div>
                        <span className="stat-value">{stats.total_words}</span>
                        <span className="stat-label">Всего слов</span>
                    </div>

                    <div className="stat-card success">
                        <div className="stat-icon">✅</div>
                        <span className="stat-value">{stats.learned_words}</span>
                        <span className="stat-label">Изучено</span>
                    </div>

                    <div className="stat-card warning">
                        <div className="stat-icon">📅</div>
                        <span className="stat-value">{stats.words_to_review}</span>
                        <span className="stat-label">На сегодня</span>
                    </div>
                </div>

                {/* Сегодня */}
                <div className="card">
                    <h2>📈 Сегодня</h2>
                    <div className="today-stats">
                        <div className="today-stat">
                            <span className="today-value">{stats.today_activity.reviewed}</span>
                            <span className="today-label">Повторено</span>
                        </div>
                        <div className="today-stat">
                            <span className="today-value">{stats.today_activity.correct}</span>
                            <span className="today-label">Правильно</span>
                        </div>
                    </div>
                </div>

                {/* Уровни */}
                <div className="card">
                    <h2>🎯 Уровни знаний</h2>
                    <div className="level-bars">
                        {stats.by_level.map(({ level, count }) => (
                            <div key={level} className="level-row">
                                <span className="level-name">{levelNames[level]}</span>
                                <div className="level-bar">
                                    <div
                                        className="level-fill"
                                        style={{
                                            width: `${(count / stats.total_words) * 100}%`,
                                            backgroundColor: levelColors[level]
                                        }}
                                    />
                                </div>
                                <span className="level-count">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Категории */}
                <div className="card">
                    <h2>📂 Категории</h2>
                    <div className="categories-grid">
                        {stats.by_category.map(({ category, total, learned }) => (
                            <div key={category} className="category-card">
                                <h3>{categoryNames[category] || category}</h3>
                                <div className="category-stats">
                                    <span>{learned}/{total}</span>
                                </div>
                                <div className="category-bar">
                                    <div
                                        className="category-fill"
                                        style={{ width: `${total > 0 ? (learned / total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}