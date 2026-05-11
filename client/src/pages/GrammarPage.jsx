import { useState, useEffect } from 'react';
import { api } from '../api/client';
import './GrammarPage.css';

const categoryIcons = {
    tenses: '⏰',
    articles: '📝',
    prepositions: '📍',
    verbs: '🎯',
    conditionals: '🔄',
    general: '📚'
};

const levelNames = {
    beginner: '🟢 Начальный',
    intermediate: '🟡 Средний',
    advanced: '🔴 Продвинутый'
};

export default function GrammarPage({ onBack }) {
    const [rules, setRules] = useState([]);
    const [selectedRule, setSelectedRule] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadRules();
    }, [filter]);

    const loadRules = async () => {
        try {
            const params = { language: 'en' };
            if (filter !== 'all') params.category = filter;
            const data = await api.getGrammarRules(params);
            setRules(data.rules);
        } catch (err) {
            console.error('Error loading grammar:', err);
        }
    };

    const categories = [...new Set(rules.map(r => r.category))];

    return (
        <div className="grammar-page">
            <header className="grammar-header">
                <button onClick={onBack} className="btn-back">← Назад</button>
                <h1>📖 Грамматика английского</h1>
            </header>

            <div className="grammar-content">
                {!selectedRule ? (
                    <>
                        <div className="grammar-filters">
                            <button
                                className={filter === 'all' ? 'active' : ''}
                                onClick={() => setFilter('all')}
                            >
                                Все
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={filter === cat ? 'active' : ''}
                                    onClick={() => setFilter(cat)}
                                >
                                    {categoryIcons[cat] || '📚'} {cat}
                                </button>
                            ))}
                        </div>

                        <div className="rules-grid">
                            {rules.map(rule => (
                                <div
                                    key={rule.id}
                                    className="rule-card"
                                    onClick={() => setSelectedRule(rule)}
                                >
                                    <div className="rule-header">
                                        <span className="rule-icon">{categoryIcons[rule.category] || '📚'}</span>
                                        <span className="rule-level">{levelNames[rule.level]}</span>
                                    </div>
                                    <h3>{rule.title}</h3>
                                    <p>{rule.description.substring(0, 100)}...</p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="rule-detail">
                        <button onClick={() => setSelectedRule(null)} className="btn-back">
                            ← К списку
                        </button>

                        <div className="rule-full-card">
                            <div className="rule-badges">
                                <span className="badge">{categoryIcons[selectedRule.category]} {selectedRule.category}</span>
                                <span className="badge">{levelNames[selectedRule.level]}</span>
                            </div>

                            <h2>{selectedRule.title}</h2>
                            <p className="rule-description">{selectedRule.description}</p>

                            <div className="rule-examples">
                                <h3>📝 Примеры:</h3>
                                {JSON.parse(selectedRule.examples).map((ex, i) => (
                                    <div key={i} className="example-item">
                                        <div className="example-en">{ex.en}</div>
                                        <div className="example-ru">{ex.ru}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}