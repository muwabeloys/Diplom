import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, '..', 'data', 'test-auth.db');

console.log('\nЗАПУСК ТЕСТОВ АВТОРИЗАЦИИ');
console.log('   Тестовая БД:', TEST_DB);

if (fs.existsSync(TEST_DB)) {
    console.log('Удалена старая тестовая БД');
    fs.unlinkSync(TEST_DB);
}

const db = new Database(TEST_DB);
console.log('Создана новая тестовая БД');

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
`);
console.log('Таблица users создана');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'test-secret';
const router = express.Router();

router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    console.log('Регистрация:', email);

    if (!username || !email || !password) {
        console.log('Ошибка: пустые поля');
        return res.status(400).json({ error: 'Все поля обязательны' });
    }
    if (password.length < 6) {
        console.log('Ошибка: короткий пароль');
        return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    }

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) {
        console.log('Ошибка: email занят');
        return res.status(400).json({ error: 'Email уже используется' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?,?,?)')
        .run(username, email, hash);

    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Пользователь создан, id:', result.lastInsertRowid);
    res.status(201).json({ token, user: { id: result.lastInsertRowid, username, email } });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Вход:', email);

    if (!email || !password) {
        console.log('Ошибка: пустые поля');
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
        console.log('Ошибка: пользователь не найден');
        return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
        console.log('Ошибка: неверный пароль');
        return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Вход выполнен, токен создан');
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

router.get('/profile', (req, res) => {
    console.log('Запрос профиля');
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        console.log('Ошибка: нет токена');
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(decoded.userId);

        if (!user) {
            console.log('Ошибка: пользователь не найден');
            return res.status(404).json({ error: 'Не найден' });
        }

        console.log('Профиль получен:', user.username);
        res.json({ user });
    } catch {
        console.log('Ошибка: неверный токен');
        res.status(401).json({ error: 'Токен недействителен' });
    }
});

app.use('/api/auth', router);

describe('Auth API', () => {
    let token = '';

    it('Регистрация нового пользователя', async () => {
        console.log('\n--- Тест: Регистрация ---');
        const res = await request(app).post('/api/auth/register').send({
            username: 'test', email: 'test@test.com', password: '123456'
        });
        console.log('   Статус:', res.status);
        console.log('   Ответ:', JSON.stringify(res.body).substring(0, 80) + '...');
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        token = res.body.token;
    });

    it('Регистрация с пустыми полями', async () => {
        console.log('\n--- Тест: Пустые поля ---');
        const res = await request(app).post('/api/auth/register').send({ username: '', email: '', password: '' });
        console.log('   Статус:', res.status, '(ожидалось 400)');
        expect(res.status).toBe(400);
    });

    it('Регистрация с коротким паролем', async () => {
        console.log('\n--- Тест: Короткий пароль ---');
        const res = await request(app).post('/api/auth/register').send({
            username: 'user', email: 'user@test.com', password: '123'
        });
        console.log('   Статус:', res.status, '(ожидалось 400)');
        expect(res.status).toBe(400);
    });

    it('Регистрация с занятым email', async () => {
        console.log('\n--- Тест: Дубликат email ---');
        const res = await request(app).post('/api/auth/register').send({
            username: 'test2', email: 'test@test.com', password: '123456'
        });
        console.log('   Статус:', res.status, '(ожидалось 400)');
        expect(res.status).toBe(400);
    });

    it('Вход с правильными данными', async () => {
        console.log('\n--- Тест: Успешный вход ---');
        const res = await request(app).post('/api/auth/login').send({
            email: 'test@test.com', password: '123456'
        });
        console.log('   Статус:', res.status);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('Вход с неверным паролем', async () => {
        console.log('\n--- Тест: Неверный пароль ---');
        const res = await request(app).post('/api/auth/login').send({
            email: 'test@test.com', password: 'wrong'
        });
        console.log('   Статус:', res.status, '(ожидалось 401)');
        expect(res.status).toBe(401);
    });

    it('Получение профиля с токеном', async () => {
        console.log('\n--- Тест: Профиль с токеном ---');
        const res = await request(app).get('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`);
        console.log('   Статус:', res.status);
        console.log('   Пользователь:', res.body.user?.username);
        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe('test');
    });

    it('Получение профиля без токена', async () => {
        console.log('\n--- Тест: Профиль без токена ---');
        const res = await request(app).get('/api/auth/profile');
        console.log('   Статус:', res.status, '(ожидалось 401)');
        expect(res.status).toBe(401);
    });
});

afterAll(() => {
    db.close();
    if (fs.existsSync(TEST_DB)) {
        fs.unlinkSync(TEST_DB);
        console.log('\n🧹 Тестовая БД удалена');
    }
    console.log('ТЕСТЫ АВТОРИЗАЦИИ ЗАВЕРШЕНЫ\n');
});