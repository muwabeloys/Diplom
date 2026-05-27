import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import Flashcard from '../components/Flashcard';
import RatingButtons from '../components/RatingButtons';
import StatsBar from '../components/StatsBar';
import ProfilePage from './ProfilePage';
import GrammarPage from './GrammarPage';
import AddWordPage from './AddWordPage';
import './StudyPage.css';
import AboutPage from './AboutPage';

export default function StudyPage() {
    const { user, logout, setUser } = useAuth();
    const [words, setWords] = useState([]);
    const [currentWord, setCurrentWord] = useState(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [stats, setStats] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showGrammar, setShowGrammar] = useState(false);
    const [showAddWord, setShowAddWord] = useState(false);
    const [wordsPerDay, setWordsPerDay] = useState(10);
    const [showAbout, setShowAbout] = useState(false);


    useEffect(() => {
        loadInitialStats();
        loadWords();
        loadProfile();
    }, []);

    const loadInitialStats = async () => {
        try {
            // Проверяем сохранённую статистику за сегодня
            const saved = localStorage.getItem('studyStats');
            if (saved) {
                const { stats: savedStats, date } = JSON.parse(saved);
                if (date === new Date().toDateString()) {
                    setStats(savedStats);
                    return;
                }
            }
            // Иначе грузим из API
            const data = await api.getWordsForStudy('en', wordsPerDay);
            setStats(data.stats);
        } catch (err) {
            console.error('Stats error:', err);
        }
    };

    const loadProfile = async () => {
        try {
            const data = await api.getProfile();
            setUser(data.user);
        } catch (err) {
            console.error('Profile error:', err);
        }
    };

    const loadWords = async () => {
        try {
            const data = await api.getWordsForStudy('en', wordsPerDay);
            setWords(data.words);
            // НЕ перезаписываем stats если они уже есть (после обновления)
            if (data.words.length > 0) {
                setCurrentWord(data.words[0]);
                setShowAnswer(false);
            } else {
                setCurrentWord(null);
            }
        } catch (err) {
            console.error('Load words error:', err);
        }
    };

    const handleReview = async (quality) => {
        if (!currentWord) return;

        try {
            await api.reviewWord(currentWord.id, quality);

            const remaining = words.slice(1);

            // Получаем актуальную статистику из API
            const profileData = await api.getProfile();
            if (profileData.user?.stats) {
                const apiStats = profileData.user.stats;
                setStats({
                    total: apiStats.total_words || 0,
                    learned: apiStats.learned_words || 0,
                    due: Math.max(0, (apiStats.total_words - apiStats.learned_words)),
                });

                localStorage.setItem('studyStats', JSON.stringify({
                    stats: {
                        total: apiStats.total_words || 0,
                        learned: apiStats.learned_words || 0,
                        due: Math.max(0, (apiStats.total_words - apiStats.learned_words)),
                    },
                    date: new Date().toDateString()
                }));
            }

            if (remaining.length > 0) {
                setWords(remaining);
                setCurrentWord(remaining[0]);
                setShowAnswer(false);
            } else {
                setWords([]);
                setCurrentWord(null);
            }
        } catch (err) {
            console.error('Review error:', err);
        }
    };

    const handleCardClick = () => {
        setShowAnswer(!showAnswer);
    };

    if (showAbout) {
        return <AboutPage onBack={() => setShowAbout(false)} />;
    }

    if (showProfile) {
        return <ProfilePage onBack={() => setShowProfile(false)} />;
    }

    if (showGrammar) {
        return <GrammarPage onBack={() => setShowGrammar(false)} />;
    }

    if (showAddWord) {
        return <AddWordPage onBack={() => {
            setShowAddWord(false);
            loadWords(); // Обновляем список слов после добавления
        }} />;
    }

    return (
        <div className="study-page">
            <header className="study-header">
                <div className="header-top">
                    <h1>Привет, {user?.username}! 👋</h1>
                    <button onClick={logout} className="btn-logout">Выйти</button>
                    <div className="header-buttons">
                        <button onClick={() => setShowAddWord(true)} className="btn-profile">➕ Слово</button>
                        <button onClick={() => setShowGrammar(true)} className="btn-profile">📖 Грамматика</button>
                        <button onClick={() => setShowProfile(true)} className="btn-profile">👤 Профиль</button>
                        <button onClick={() => setShowAbout(true)} className="btn-profile">ℹ️ О сайте</button>


                    </div>
                </div>
                {stats && <StatsBar stats={stats} />}

                {stats && (
                    <div className="words-settings">
                        <span className="settings-label">Слов за раз:</span>
                        <div className="settings-buttons">
                            {[5, 10, 15, 20].map(num => (
                                <button
                                    key={num}
                                    className={`btn-count ${wordsPerDay === num ? 'active' : ''}`}
                                    onClick={() => {
                                        setWordsPerDay(num);
                                        loadWords();
                                    }}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <main className="study-main">
                {currentWord ? (
                    <div className="study-area">
                        <Flashcard
                            word={currentWord}
                            showAnswer={showAnswer}
                            onClick={handleCardClick}
                        />
                        {showAnswer && (
                            <RatingButtons onRate={handleReview} />
                        )}
                    </div>
                ) : (
                    <div className="complete-card">
                        <div className="complete-icon">🎉</div>
                        <h2>Отлично!</h2>
                        <p>Все слова на сегодня повторены</p>
                        <p className="sub-text">Возвращайтесь позже для повторения</p>
                        <button onClick={loadWords} className="btn-refresh">
                            🔄 Проверить ещё раз
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}