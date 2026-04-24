import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './AuthPage.css';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const { login, register } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                await login({ email: formData.email, password: formData.password });
            } else {
                await register({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                });
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({ username: '', email: '', password: '' });
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>📚 Языковой Тренажёр</h1>
                    <p>{isLogin ? 'Войдите в аккаунт' : 'Создайте новый аккаунт'}</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <input
                            type="text"
                            name="username"
                            placeholder="Имя пользователя"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            minLength={3}
                        />
                    )}

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Пароль"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                    />

                    <button type="submit" className="btn-submit">
                        {isLogin ? 'Войти' : 'Зарегистрироваться'}
                    </button>
                </form>

                {error && <div className="error-message">{error}</div>}

                <button onClick={toggleMode} className="btn-toggle">
                    {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                </button>
            </div>
        </div>
    );
}