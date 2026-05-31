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
const TEST_DB = path.join(__dirname, '..', 'data', 'test-words.db');

console.log('\n📚 ЗАПУСК ТЕСТОВ СЛОВ');
console.log('   Тестовая БД:', TEST_DB);

if (fs.existsSync(TEST_DB)) {
    console.log('   ❌ Удалена старая БД');
    fs.unlinkSync(TEST_DB);
}

const db = new Database(TEST_DB);
console.log('   ✅ Создана новая БД');

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
console.log('   ✅ Таблицы созданы');

const app = express();
app.use(cors());
app.use(express.json());

const router = express.Router();

router.get('/study', (req, res) => {
    console.log('   📖 Запрос слов для изучения');
    const words = db.prepare(`
    SELECT id, word, translation, example, category, level
    FROM words WHERE user_id = 1 AND language = 'en'
    AND datetime(next_review) <= datetime('now', '+1 day')
    LIMIT 10
  `).all();
    const stats = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN level >= 3 THEN 1 ELSE 0 END) as learned,
           SUM(CASE WHEN datetime(next_review) <= datetime('now', '+1 day') THEN 1 ELSE 0 END) as due
    FROM words WHERE user_id = 1
  `).get();
    console.log(`   ✅ Найдено слов: ${words.length}, изучено: ${stats.learned}/${stats.total}`);
    res.json({ words, stats });
});

router.post('/', (req, res) => {
    const { word, translation, example = '', example_translation = '', category = 'basics' } = req.body;
    console.log(`   ➕ Добавление слова: "${word}" → "${translation}"`);

    if (!word || !translation) {
        console.log('   ❌ Пустые поля');
        return res.status(400).json({ error: 'Слово и перевод обязательны' });
    }

    const exists = db.prepare('SELECT id FROM words WHERE user_id = 1 AND word = ?').get(word.toLowerCase());
    if (exists) {
        console.log('   ❌ Слово уже существует');
        return res.status(400).json({ error: 'Такое слово уже существует' });
    }

    db.prepare('INSERT INTO words (user_id, word, translation, example, example_translation, category) VALUES (1,?,?,?,?,?)')
        .run(word.toLowerCase(), translation.toLowerCase(), example, example_translation, category);
    console.log('   ✅ Слово добавлено');
    res.status(201).json({ message: 'Слово успешно добавлено' });
});

router.put('/:id/review', (req, res) => {
    const { quality } = req.body;
    const { id } = req.params;
    console.log(`   ⭐ Оценка слова id=${id}, quality=${quality}`);

    if (quality === undefined || quality < 0 || quality > 5) {
        console.log('   ❌ Неверная оценка');
        return res.status(400).json({ error: 'Оценка должна быть от 0 до 5' });
    }

    const word = db.prepare('SELECT id, level FROM words WHERE id = ? AND user_id = 1').get(id);
    if (!word) {
        console.log('   ❌ Слово не найдено');
        return res.status(404).json({ error: 'Слово не найдено' });
    }

    const newLevel = quality >= 4 ? Math.min(5, word.level + 1) : quality >= 2 ? word.level : Math.max(0, word.level - 1);
    const intervals = [0, 1, 3, 7, 14, 30];

    db.prepare("UPDATE words SET level = ?, next_review = datetime('now', '+' || ? || ' days') WHERE id = ?")
        .run(newLevel, intervals[newLevel], id);
    console.log(`   ✅ Новый уровень: ${word.level} → ${newLevel}`);
    res.json({ new_level: newLevel, next_review_days: intervals[newLevel] });
});

router.get('/categories', (req, res) => {
    console.log('   📂 Запрос категорий');
    const categories = db.prepare(`
    SELECT category, COUNT(*) as total,
           SUM(CASE WHEN level >= 3 THEN 1 ELSE 0 END) as learned
    FROM words WHERE user_id = 1 GROUP BY category
  `).all();
    console.log(`   ✅ Найдено категорий: ${categories.length}`);
    res.json({ categories });
});

app.use('/api/words', router);

describe('📚 Words API', () => {
    beforeAll(() => {
        console.log('\n--- Подготовка данных ---');
        const hash = bcrypt.hashSync('123456', 10);
        db.prepare('INSERT INTO users (id, username, email, password_hash) VALUES (1,?,?,?)')
            .run('test', 'test@test.com', hash);
        console.log('   ✅ Пользователь создан');

        const words = [
            ['Hello', 'Привет', 'Hello!', 'Привет!', 'basics'],
            ['World', 'Мир', 'World!', 'Мир!', 'basics'],
        ];
        const insert = db.prepare(
            "INSERT INTO words (id, user_id, word, translation, example, example_translation, category) VALUES (?,1,?,?,?,?,?)"
        );
        words.forEach((w, i) => insert.run(i + 1, ...w));
        console.log(`   ✅ Добавлено ${words.length} стартовых слов`);
    });

    it('✅ GET /study — возвращает слова', async () => {
        console.log('\n--- Тест: Получение слов ---');
        const res = await request(app).get('/api/words/study');
        console.log(`   Статус: ${res.status}, слов: ${res.body.words?.length}`);
        expect(res.status).toBe(200);
        expect(res.body.words.length).toBeGreaterThan(0);
        expect(res.body.stats).toHaveProperty('total');
    });

    it('✅ POST / — добавляет слово', async () => {
        console.log('\n--- Тест: Добавление слова ---');
        const res = await request(app).post('/api/words').send({
            word: 'Cat', translation: 'Кошка', example: 'I have a cat', example_translation: 'У меня есть кот'
        });
        console.log(`   Статус: ${res.status}`);
        expect(res.status).toBe(201);
    });

    it('❌ POST / — пустые поля', async () => {
        console.log('\n--- Тест: Пустые поля ---');
        const res = await request(app).post('/api/words').send({ word: '', translation: '' });
        console.log(`   Статус: ${res.status} (ожидалось 400)`);
        expect(res.status).toBe(400);
    });

    it('✅ PUT /:id/review — оценка слова', async () => {
        console.log('\n--- Тест: Оценка слова ---');
        const res = await request(app).put('/api/words/1/review').send({ quality: 5 });
        console.log(`   Статус: ${res.status}, новый уровень: ${res.body.new_level}`);
        expect(res.status).toBe(200);
        expect(res.body.new_level).toBe(1);
    });

    it('❌ PUT /999/review — неверный id', async () => {
        console.log('\n--- Тест: Несуществующее слово ---');
        const res = await request(app).put('/api/words/999/review').send({ quality: 3 });
        console.log(`   Статус: ${res.status} (ожидалось 404)`);
        expect(res.status).toBe(404);
    });

    it('✅ GET /categories — категории', async () => {
        console.log('\n--- Тест: Категории ---');
        const res = await request(app).get('/api/words/categories');
        console.log(`   Статус: ${res.status}, категорий: ${res.body.categories?.length}`);
        expect(res.status).toBe(200);
        expect(res.body.categories.length).toBeGreaterThan(0);
    });
});

afterAll(() => {
    db.close();
    if (fs.existsSync(TEST_DB)) {
        fs.unlinkSync(TEST_DB);
        console.log('\n🧹 Тестовая БД удалена');
    }
    console.log('📚 ТЕСТЫ СЛОВ ЗАВЕРШЕНЫ\n');
});