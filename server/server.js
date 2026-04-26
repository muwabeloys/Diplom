import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/auth.js';
import wordRoutes from './src/routes/words.js';
import adminRoutes from './src/routes/admin.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/words', wordRoutes);

// Админка
app.use('/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`
╔═════════════════════════════════════════╗
║  Сервер: http://localhost:${PORT}       ║
║  Админка: http://localhost:${PORT}/admin║
║  API: http://localhost:${PORT}/api      ║
╚═════════════════════════════════════════╝
  `);
});