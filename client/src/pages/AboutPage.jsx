import './AboutPage.css';

export default function AboutPage({ onBack }) {
    return (
        <div className="about-page">
            <header className="about-header">
                <button onClick={onBack} className="btn-back">← Назад</button>
                <h1>📚 О приложении</h1>
            </header>

            <div className="about-content">
                <div className="about-card">
                    <h2>🎯 Что это за приложение?</h2>
                    <p>
                        Языковой тренажёр — это веб-приложение для эффективного изучения
                        иностранных слов. Основано на научном методе интервального повторения.
                    </p>
                </div>

                <div className="about-card">
                    <h2>🧠 Как работает интервальное повторение?</h2>
                    <p>Вы видите слово и оцениваете, насколько хорошо его помните:</p>

                    <div className="steps">
                        <div className="step">
                            <div className="step-icon">1</div>
                            <div className="step-text">
                                <strong>Увидели слово</strong>
                                <p>Нажмите на карточку, чтобы увидеть перевод и пример</p>
                            </div>
                        </div>
                        <div className="step">
                            <div className="step-icon">2</div>
                            <div className="step-text">
                                <strong>Оцените знание</strong>
                                <p>Выберите одну из 4 оценок — от "Сложно" до "Отлично"</p>
                            </div>
                        </div>
                        <div className="step">
                            <div className="step-icon">3</div>
                            <div className="step-text">
                                <strong>Система запоминает</strong>
                                <p>Хорошо знакомые слова показываются реже, сложные — чаще</p>
                            </div>
                        </div>
                        <div className="step">
                            <div className="step-icon">4</div>
                            <div className="step-text">
                                <strong>Повторяйте вовремя</strong>
                                <p>Возвращайтесь каждый день — система сама подберёт слова для повторения</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="about-card">
                    <h2>📊 Уровни и интервалы</h2>
                    <table className="levels-table">
                        <thead>
                            <tr>
                                <th>Уровень</th>
                                <th>Интервал</th>
                                <th>Когда покажут снова</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>0 — Новое</td><td>0 дней</td><td>Сегодня</td></tr>
                            <tr><td>1 — Начал</td><td>1 день</td><td>Завтра</td></tr>
                            <tr><td>2 — Учу</td><td>3 дня</td><td>Через 3 дня</td></tr>
                            <tr><td>3 — Знаю</td><td>7 дней</td><td>Через неделю</td></tr>
                            <tr><td>4 — Хорошо</td><td>14 дней</td><td>Через 2 недели</td></tr>
                            <tr><td>5 — Отлично</td><td>30 дней</td><td>Через месяц</td></tr>
                        </tbody>
                    </table>
                </div>

                <div className="about-card">
                    <h2>💡 Советы</h2>
                    <ul className="tips">
                        <li>Занимайтесь каждый день по 10-15 минут</li>
                        <li>Добавляйте свои слова для персонализации</li>
                        <li>Честно оценивайте знание — это важно для алгоритма</li>
                        <li>Используйте примеры для запоминания контекста</li>
                        <li>Пропуск дня не страшен — система адаптируется</li>
                    </ul>
                </div>

                <div className="about-card">
                    <h2>🛠 Технологии</h2>
                    <div className="tech-stack">
                        <span className="tech-tag">React</span>
                        <span className="tech-tag">Express.js</span>
                        <span className="tech-tag">SQLite</span>
                        <span className="tech-tag">JWT</span>
                        <span className="tech-tag">SM-2 алгоритм</span>
                    </div>
                    <p className="tech-desc">
                        Frontend: React 18 + Vite. Backend: Node.js + Express.js.
                        База данных: SQLite. Аутентификация: JSON Web Tokens.
                    </p>
                </div>
            </div>
        </div>
    );
}