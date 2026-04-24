import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'diplom-secret-key-2024';

export const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Токен недействителен или истек' });
    }
};

export { JWT_SECRET };