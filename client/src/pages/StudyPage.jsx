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

export default function StudyPage() {
    const { user, logout, setUser } = useAuth();
    const [words, setWords] = useState([]);
    const [currentWord, setCurrentWord] = useState(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [stats, setStats] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showGrammar, setShowGrammar] = useState(false);
    const [showAddWord, setShowAddWord] = useState(false);

    useEffect(() => {
        loadWords();
        loadProfile();
    }, []);

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
            const data = await api.getWordsForStudy('en', 10);
            setWords(data.words);
            // Обновляем stats только если их нет (первый раз)
            setStats(prevStats => prevStats || data.stats);
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

            // Обновляем статистику
            setStats(prevStats => {
                if (!prevStats) return prevStats;
                const newStats = { ...prevStats };
                if (newStats.due > 0) newStats.due -= 1;
                if (quality >= 4) newStats.learned += 1;
                return newStats;
            });

            // Если это было последнее слово в текущей порции
            if (remaining.length === 0) {
                // Сразу грузим новые, не показывая сообщение
                const data = await api.getWordsForStudy('en', 10);
                if (data.words.length > 0) {
                    setWords(data.words);
                    setCurrentWord(data.words[0]);
                    setShowAnswer(false);
                } else {
                    // Только если слов реально нет
                    setWords([]);
                    setCurrentWord(null);
                }
            } else {
                setWords(remaining);
                setCurrentWord(remaining[0]);
                setShowAnswer(false);
            }
        } catch (err) {
            console.error('Review error:', err);
        }
    };

    const handleCardClick = () => {
        setShowAnswer(!showAnswer);
    };

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
                    <div className="header-buttons">
                        <button onClick={() => setShowAddWord(true)} className="btn-profile">➕ Слово</button>
                        <button onClick={() => setShowGrammar(true)} className="btn-profile">📖 Грамматика</button>
                        <button onClick={() => setShowProfile(true)} className="btn-profile">👤 Профиль</button>
                        <button onClick={logout} className="btn-logout">Выйти</button>
                    </div>
                </div>
                {stats && <StatsBar stats={stats} />}
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