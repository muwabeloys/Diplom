import { useState } from 'react';
import { api } from '../api/client';
import './AddWordPage.css';
import { translateWord } from '../api/translator';

const categories = [
    { value: 'basics', label: '📝 Основы' },
    { value: 'food', label: '🍽️ Еда' },
    { value: 'travel', label: '✈️ Путешествия' },
    { value: 'work', label: '💼 Работа' },
    { value: 'hobbies', label: '🎨 Хобби' },
];

export default function AddWordPage({ onBack }) {
    const [form, setForm] = useState({
        word: '',
        translation: '',
        example: '',
        example_translation: '',
        category: 'basics'
    });
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [translating, setTranslating] = useState({ word: false, example: false });

    // Перевод слова
    const handleTranslateWord = async () => {
        if (!form.word) return;
        setTranslating(prev => ({ ...prev, word: true }));
        const result = await translateWord(form.word);
        if (result) setForm(prev => ({ ...prev, translation: result }));
        setTranslating(prev => ({ ...prev, word: false }));
    };

    // Перевод примера
    const handleTranslateExample = async () => {
        if (!form.example) return;
        setTranslating(prev => ({ ...prev, example: true }));
        const result = await translateWord(form.example);
        if (result) setForm(prev => ({ ...prev, example_translation: result }));
        setTranslating(prev => ({ ...prev, example: false }));
    };

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        if (!form.word || !form.translation) {
            setError('Слово и перевод обязательны');
            return;
        }
        setLoading(true);
        try {
            const isRussianWord = /[а-яё]/i.test(form.word);
            const wordData = {
                word: isRussianWord ? form.translation.toLowerCase() : form.word.toLowerCase(),
                translation: isRussianWord ? form.word.toLowerCase() : form.translation.toLowerCase(),
                example: form.example,
                example_translation: form.example_translation,
                category: form.category
            };
            await api.addWord(wordData);
            setMessage(`✅ Слово "${wordData.word}" → "${wordData.translation}" добавлено!`);
            setForm({ word: '', translation: '', example: '', example_translation: '', category: 'basics' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-word-page">
            <header className="add-word-header">
                <button onClick={onBack} className="btn-back">← Назад</button>
                <h1>➕ Добавить слово</h1>
            </header>

            <div className="add-word-content">
                <form onSubmit={handleSubmit} className="add-word-form">
                    {/* Слово */}
                    <div className="form-group">
                        <label>Слово * (на любом языке)</label>
                        <div className="input-with-btn">
                            <input
                                type="text"
                                name="word"
                                value={form.word}
                                onChange={handleChange}
                                placeholder="Например: Cat или Кошка"
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                className="btn-translate"
                                onClick={handleTranslateWord}
                                disabled={translating.word || !form.word}
                            >
                                {translating.word ? '🔄' : '🌐'}
                            </button>
                        </div>
                    </div>

                    {/* Перевод */}
                    <div className="form-group">
                        <label>Перевод *</label>
                        <input
                            type="text"
                            name="translation"
                            value={form.translation}
                            onChange={handleChange}
                            placeholder="Введите вручную или нажмите 🌐"
                        />
                    </div>

                    {/* Пример */}
                    <div className="form-group">
                        <label>Пример использования</label>
                        <div className="input-with-btn">
                            <input
                                type="text"
                                name="example"
                                value={form.example}
                                onChange={handleChange}
                                placeholder="I have a cat / У меня есть кошка"
                            />
                            <button
                                type="button"
                                className="btn-translate"
                                onClick={handleTranslateExample}
                                disabled={translating.example || !form.example}
                            >
                                {translating.example ? '🔄' : '🌐'}
                            </button>
                        </div>
                    </div>

                    {/* Перевод примера */}
                    <div className="form-group">
                        <label>Перевод примера</label>
                        <input
                            type="text"
                            name="example_translation"
                            value={form.example_translation}
                            onChange={handleChange}
                            placeholder="Введите вручную или нажмите 🌐"
                        />
                    </div>

                    {/* Категория */}
                    <div className="form-group">
                        <label>Категория</label>
                        <select name="category" value={form.category} onChange={handleChange}>
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Добавление...' : '➕ Добавить слово'}
                    </button>
                </form>

                {message && <div className="message-success">{message}</div>}
                {error && <div className="message-error">{error}</div>}
            </div>
        </div>
    );
}