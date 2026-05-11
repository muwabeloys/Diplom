import { Router } from 'express';
import db from '../config/database.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/grammar/categories
router.get('/categories', (req, res) => {
    const categories = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM grammar_rules WHERE language = ?
    GROUP BY category
  `).all(req.query.language || 'en');
    res.json({ categories });
});

// GET /api/grammar
router.get('/', (req, res) => {
    const { language = 'en', category, level } = req.query;
    let sql = 'SELECT * FROM grammar_rules WHERE language = ?';
    const params = [language];

    if (category) {
        sql += ' AND category = ?';
        params.push(category);
    }
    if (level) {
        sql += ' AND level = ?';
        params.push(level);
    }

    sql += ' ORDER BY order_index ASC';
    const rules = db.prepare(sql).all(...params);
    res.json({ rules });
});

// GET /api/grammar/:id
router.get('/:id', (req, res) => {
    const rule = db.prepare('SELECT * FROM grammar_rules WHERE id = ?')
        .get(req.params.id);

    if (!rule) return res.status(404).json({ error: 'Правило не найдено' });

    rule.examples = JSON.parse(rule.examples);
    res.json({ rule });
});

export default router;