import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/auth.js';
import wordRoutes from './src/routes/words.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/words', wordRoutes);

// Проверка работы сервера
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Запуск
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     Сервер запущен на порту ${PORT}    ║
║     http://localhost:${PORT}           ║
║     Статус: OK                         ║
╚════════════════════════════════════════╝
  `);
});