import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'diplom-secret-key-2024';

export const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }

        req.userId = user.id;
        req.userRole = user.role;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Токен недействителен или истек' });
    }
};

export const adminAuth = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора' });
    }
    next();
};

export { JWT_SECRET };