import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { auth, JWT_SECRET } from '../middleware/auth.js';
import { seedStarterWords } from '../seed.js';
import { adminAuth } from '../middleware/auth.js';

const router = Router();

// Только админ может сделать другого пользователя админом
router.put('/make-admin/:userId', auth, adminAuth, (req, res) => {
    try {
        const { userId } = req.params;

        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', userId);
        res.json({ message: 'Пользователь стал администратором' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Снять админа
router.put('/remove-admin/:userId', auth, adminAuth, (req, res) => {
    try {
        const { userId } = req.params;

        if (parseInt(userId) === req.userId) {
            return res.status(400).json({ error: 'Нельзя снять админа с самого себя' });
        }

        db.prepare('UPDATE users SET role = ? WHERE id = ?').run('user', userId);
        res.json({ message: 'Администратор снят' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Список пользователей (только для админа)
router.get('/users', auth, adminAuth, (req, res) => {
    try {
        const users = db.prepare(`
      SELECT u.id, u.username, u.email, u.role, u.created_at,
             COUNT(w.id) as total_words,
             SUM(CASE WHEN w.level >= 3 THEN 1 ELSE 0 END) as learned_words
      FROM users u
      LEFT JOIN words w ON u.id = w.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Валидация
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        if (username.length < 3) {
            return res.status(400).json({ error: 'Имя пользователя минимум 3 символа' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль минимум 6 символов' });
        }
        if (!email.includes('@')) {
            return res.status(400).json({ error: 'Некорректный email' });
        }

        // Проверка уникальности
        const existing = db.prepare(
            'SELECT id FROM users WHERE email = ? OR username = ?'
        ).get(email, username);

        if (existing) {
            return res.status(400).json({ error: 'Email или имя пользователя уже заняты' });
        }

        // Создание пользователя
        const passwordHash = bcrypt.hashSync(password, 10);
        const result = db.prepare(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
        ).run(username, email, passwordHash);

        const userId = result.lastInsertRowid;

        // Добавляем стартовые слова
        seedStarterWords(userId);

        // Создаем токен
        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({
            message: 'Регистрация успешна',
            token,
            user: { id: userId, username, email }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            message: 'Вход выполнен',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                daily_goal: user.daily_goal
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// GET /api/auth/profile
router.get('/profile', auth, (req, res) => {
    try {
        const user = db.prepare(
            'SELECT id, username, email, daily_goal, created_at FROM users WHERE id = ?'
        ).get(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Получаем статистику пользователя
        const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_words,
        SUM(CASE WHEN level >= 3 THEN 1 ELSE 0 END) as learned_words,
        SUM(CASE WHEN next_review <= datetime('now') THEN 1 ELSE 0 END) as words_to_review
      FROM words WHERE user_id = ?
    `).get(req.userId);

        res.json({
            user: {
                ...user,
                stats: stats || { total_words: 0, learned_words: 0, words_to_review: 0 }
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Ошибка получения профиля' });
    }
});

export default router;