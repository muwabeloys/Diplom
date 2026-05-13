import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, '..', 'data', 'test-admin.db');

if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

const db = new Database(TEST_DB);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    daily_goal INTEGER DEFAULT 20,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    example TEXT DEFAULT '',
    example_translation TEXT DEFAULT '',
    category TEXT DEFAULT 'basics',
    level INTEGER DEFAULT 0,
    next_review DATETIME DEFAULT CURRENT_TIMESTAMP,
    review_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const app = express();
app.use(cors());
app.use(express.json());

// Тестовый роутер админки
const router = express.Router();

router.get('/api/stats', (req, res) => {
    const stats = {
        users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        words: db.prepare('SELECT COUNT(*) as count FROM words').get().count,
        admins: db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count,
    };
    res.json({ stats });
});

router.get('/api/users', (req, res) => {
    const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.role, u.created_at,
           COUNT(w.id) as total_words,
           SUM(CASE WHEN w.level >= 3 THEN 1 ELSE 0 END) as learned_words
    FROM users u LEFT JOIN words w ON u.id = w.user_id
    GROUP BY u.id ORDER BY u.id
  `).all();
    res.json({ users });
});

router.get('/api/users/:id/words', (req, res) => {
    const words = db.prepare('SELECT * FROM words WHERE user_id = ?').all(req.params.id);
    res.json({ words });
});

app.use('/admin', router);

describe('⚙️ Admin API', () => {
    beforeAll(() => {
        db.prepare('INSERT OR IGNORE INTO users (id, username, email, password_hash, role) VALUES (1,?,?,?,?)')
            .run('admin', 'admin@test.com', bcrypt.hashSync('123456', 10), 'admin');
        db.prepare("INSERT OR IGNORE INTO words (id, user_id, word, translation) VALUES (1,1,'Hello','Привет')").run();
    });

    it('GET /admin/api/stats — возвращает статистику', async () => {
        const res = await request(app).get('/admin/api/stats');
        expect(res.status).toBe(200);
        expect(res.body.stats.users).toBeGreaterThan(0);
        expect(res.body.stats.words).toBeGreaterThan(0);
    });

    it('GET /admin/api/users — возвращает список пользователей', async () => {
        const res = await request(app).get('/admin/api/users');
        expect(res.status).toBe(200);
        expect(res.body.users.length).toBeGreaterThan(0);
    });

    it('GET /admin/api/users/1/words — возвращает слова пользователя', async () => {
        const res = await request(app).get('/admin/api/users/1/words');
        expect(res.status).toBe(200);
        expect(res.body.words.length).toBeGreaterThan(0);
    });
});

afterAll(() => {
    db.close();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});