import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import Flashcard from '../components/Flashcard';
import RatingButtons from '../components/RatingButtons';
import StatsBar from '../components/StatsBar';
import './StudyPage.css';

export default function StudyPage() {
    const { user, logout, setUser } = useAuth();
    const [words, setWords] = useState([]);
    const [currentWord, setCurrentWord] = useState(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [stats, setStats] = useState(null);

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
            setStats(data.stats);
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
            setWords(remaining);

            if (remaining.length > 0) {
                setCurrentWord(remaining[0]);
                setShowAnswer(false);
            } else {
                setCurrentWord(null);
                setTimeout(loadWords, 1000);
            }
        } catch (err) {
            console.error('Review error:', err);
        }
    };

    const handleCardClick = () => {
        setShowAnswer(!showAnswer);
    };

    return (
        <div className="study-page">
            <header className="study-header">
                <div className="header-top">
                    <h1>Привет, {user?.username}! 👋</h1>
                    <button onClick={logout} className="btn-logout">Выйти</button>
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