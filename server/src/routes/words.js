import { Router } from 'express';
import db from '../config/database.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Все маршруты защищены
router.use(auth);

// GET /api/words/study - получить слова для изучения
router.get('/study', (req, res) => {
    try {
        const { language = 'en', limit = 10 } = req.query;

        const words = db.prepare(`
      SELECT id, word, translation, example, category, level, review_count
      FROM words 
      WHERE user_id = ? 
        AND language = ? 
        AND next_review <= datetime('now')
      ORDER BY level ASC, RANDOM()
      LIMIT ?
    `).all(req.userId, language, parseInt(limit));

        const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN level >= 3 THEN 1 ELSE 0 END) as learned,
        SUM(CASE WHEN next_review <= datetime('now') THEN 1 ELSE 0 END) as due
      FROM words 
      WHERE user_id = ? AND language = ?
    `).get(req.userId, language);

        res.json({
            words,
            stats: stats || { total: 0, learned: 0, due: 0 }
        });

    } catch (error) {
        console.error('Get words error:', error);
        res.status(500).json({ error: 'Ошибка получения слов' });
    }
});

// PUT /api/words/:id/review - оценить слово
router.put('/:id/review', (req, res) => {
    try {
        const { id } = req.params;
        const { quality } = req.body; // 0-5

        if (quality === undefined || quality < 0 || quality > 5) {
            return res.status(400).json({ error: 'Оценка должна быть от 0 до 5' });
        }

        // Проверяем, что слово принадлежит пользователю
        const word = db.prepare(
            'SELECT id, level FROM words WHERE id = ? AND user_id = ?'
        ).get(id, req.userId);

        if (!word) {
            return res.status(404).json({ error: 'Слово не найдено' });
        }

        // Алгоритм интервального повторения
        let newLevel = word.level;
        if (quality >= 4) {
            newLevel = Math.min(5, word.level + 1); // Повышаем
        } else if (quality >= 2) {
            newLevel = word.level; // Оставляем
        } else {
            newLevel = Math.max(0, word.level - 1); // Понижаем
        }

        // Интервалы в днях
        const intervals = [0, 1, 3, 7, 14, 30];
        const daysUntilReview = intervals[newLevel];

        db.prepare(`
      UPDATE words 
      SET level = ?, 
          next_review = datetime('now', '+' || ? || ' days'),
          review_count = review_count + 1
      WHERE id = ? AND user_id = ?
    `).run(newLevel, daysUntilReview, id, req.userId);

        res.json({
            success: true,
            new_level: newLevel,
            next_review_days: daysUntilReview,
            message: quality >= 4 ? 'Отлично!' : quality >= 2 ? 'Хорошо' : 'Повторим позже'
        });

    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ error: 'Ошибка обновления прогресса' });
    }
});

// POST /api/words - добавить новое слово
router.post('/', (req, res) => {
    try {
        const { language = 'en', word, translation, example = '', category = 'basics' } = req.body;

        if (!word || !translation) {
            return res.status(400).json({ error: 'Слово и перевод обязательны' });
        }

        // Проверка на дубликат
        const existing = db.prepare(
            'SELECT id FROM words WHERE user_id = ? AND word = ? AND language = ?'
        ).get(req.userId, word.toLowerCase(), language);

        if (existing) {
            return res.status(400).json({ error: 'Такое слово уже существует' });
        }

        db.prepare(`
      INSERT INTO words (user_id, language, word, translation, example, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.userId, language, word.toLowerCase(), translation.toLowerCase(), example, category);

        res.status(201).json({ message: 'Слово успешно добавлено' });

    } catch (error) {
        console.error('Add word error:', error);
        res.status(500).json({ error: 'Ошибка добавления слова' });
    }
});

// GET /api/words/categories - получить категории
router.get('/categories', (req, res) => {
    try {
        const { language = 'en' } = req.query;

        const categories = db.prepare(`
      SELECT 
        category,
        COUNT(*) as total,
        SUM(CASE WHEN level >= 3 THEN 1 ELSE 0 END) as learned
      FROM words 
      WHERE user_id = ? AND language = ?
      GROUP BY category
    `).all(req.userId, language);

        res.json({ categories });

    } catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({ error: 'Ошибка получения категорий' });
    }
});

export default router;