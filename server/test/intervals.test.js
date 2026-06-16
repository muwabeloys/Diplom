import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, '..', 'data', 'test-intervals.db');

console.log('\n🧠 ЗАПУСК ТЕСТОВ ИНТЕРВАЛЬНОГО ПОВТОРЕНИЯ');
console.log('   Тестовая БД:', TEST_DB);

// Очистка
if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
    try { fs.unlinkSync(TEST_DB + '-shm'); } catch { }
    try { fs.unlinkSync(TEST_DB + '-wal'); } catch { }
    console.log('   ❌ Удалена старая БД');
}

const db = new Database(TEST_DB);
console.log('   ✅ Создана новая БД');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    level INTEGER DEFAULT 0,
    next_review DATETIME DEFAULT (datetime('now')),
    review_count INTEGER DEFAULT 0
  );
`);
console.log('   ✅ Таблицы созданы\n');

// Функция оценки (копия логики из words.js)
function reviewWord(wordId, quality) {
    const word = db.prepare('SELECT id, word, level FROM words WHERE id = ?').get(wordId);
    if (!word) throw new Error('Слово не найдено');

    const oldLevel = word.level;
    let newLevel = word.level;

    if (quality >= 4) newLevel = Math.min(5, word.level + 1);
    else if (quality >= 2) newLevel = word.level;
    else newLevel = Math.max(0, word.level - 1);

    const intervals = [0, 1, 3, 7, 14, 30];
    const days = intervals[newLevel];

    db.prepare(`
    UPDATE words 
    SET level = ?, 
        next_review = date('now', '+' || ? || ' days'),
        review_count = review_count + 1
    WHERE id = ?
  `).run(newLevel, days, wordId);

    const qualityNames = { 0: 'Сложно 🔴', 2: 'Не очень 🟡', 4: 'Хорошо 🟢', 5: 'Отлично ⭐' };
    console.log(`   📝 "${word.word}": ${qualityNames[quality]} | level: ${oldLevel} → ${newLevel} | интервал: ${days} дн.`);

    return { newLevel, nextReviewDays: days, oldLevel, word: word.word };
}

function getWordsForStudy() {
    return db.prepare(`
    SELECT * FROM words 
    WHERE datetime(next_review) <= datetime('now', '+1 day')
  `).all();
}

describe('🧠 Интервальное повторение (SM-2)', () => {

    beforeAll(() => {
        console.log('--- Подготовка тестовых данных ---');
        db.prepare('INSERT INTO users (id, username, email, password_hash) VALUES (1, ?, ?, ?)')
            .run('test', 'test@test.com', 'hash');
        console.log('   ✅ Пользователь создан (id=1)');

        db.prepare("INSERT INTO words (id, user_id, word, translation, level, next_review) VALUES (1, 1, 'Hello', 'Привет', 0, datetime('now'))").run();
        db.prepare("INSERT INTO words (id, user_id, word, translation, level, next_review) VALUES (2, 1, 'World', 'Мир', 0, datetime('now'))").run();
        db.prepare("INSERT INTO words (id, user_id, word, translation, level, next_review) VALUES (3, 1, 'Cat', 'Кошка', 0, datetime('now'))").run();
        console.log('   ✅ Добавлены тестовые слова: Hello, World, Cat\n');
    });

    describe('📈 Изменение уровней', () => {

        it('Оценка "Отлично" ⭐ (5) на level 0 → level 1, интервал 1 день', () => {
            console.log('\n--- Тест 1: Отлично на новом слове ---');
            const result = reviewWord(1, 5);
            expect(result.newLevel).toBe(1);
            expect(result.nextReviewDays).toBe(1);
            console.log('   ✅ Уровень повышен, интервал = 1 день\n');
        });

        it('Оценка "Хорошо" 🟢 (4) на level 1 → level 2, интервал 3 дня', () => {
            console.log('\n--- Тест 2: Хорошо на level 1 ---');
            db.prepare('UPDATE words SET level = 1 WHERE id = 1').run();
            const result = reviewWord(1, 4);
            expect(result.newLevel).toBe(2);
            expect(result.nextReviewDays).toBe(3);
            console.log('   ✅ Уровень повышен до 2, интервал = 3 дня\n');
        });

        it('Оценка "Сложно" 🔴 (0) понижает уровень', () => {
            console.log('\n--- Тест 3: Сложно понижает уровень ---');
            db.prepare('UPDATE words SET level = 2 WHERE id = 2').run();
            const result = reviewWord(2, 0);
            expect(result.newLevel).toBe(1);
            expect(result.nextReviewDays).toBe(1);
            console.log('   ✅ Уровень понижен с 2 до 1\n');
        });

        it('Уровень не может быть меньше 0', () => {
            console.log('\n--- Тест 4: Минимальный уровень ---');
            db.prepare('UPDATE words SET level = 0 WHERE id = 3').run();
            const result = reviewWord(3, 0);
            expect(result.newLevel).toBe(0);
            expect(result.nextReviewDays).toBe(0);
            console.log('   ✅ Уровень остался 0 (не ушёл в минус)\n');
        });

        it('Уровень не может быть больше 5', () => {
            console.log('\n--- Тест 5: Максимальный уровень ---');
            db.prepare('UPDATE words SET level = 5 WHERE id = 1').run();
            const result = reviewWord(1, 5);
            expect(result.newLevel).toBe(5);
            expect(result.nextReviewDays).toBe(30);
            console.log('   ✅ Уровень остался 5 (максимум), интервал = 30 дней\n');
        });

        it('Оценка "Не очень" 🟡 (2) не меняет уровень', () => {
            console.log('\n--- Тест 6: Нейтральная оценка ---');
            db.prepare('UPDATE words SET level = 2 WHERE id = 2').run();
            const result = reviewWord(2, 2);
            expect(result.newLevel).toBe(2);
            expect(result.nextReviewDays).toBe(3);
            console.log('   ✅ Уровень не изменился (2)\n');
        });
    });

    describe('🔄 Полный цикл изучения', () => {

        it('5 отличных оценок подряд: 0 → 1 → 2 → 3 → 4 → 5', () => {
            console.log('\n--- Тест 7: Полный цикл до уровня 5 ---');
            db.prepare("INSERT INTO words (id, user_id, word, translation, level, next_review) VALUES (4, 1, 'Dog', 'Собака', 0, datetime('now'))").run();
            console.log('   🆕 Создано слово "Dog" с level=0');

            const levels = [];
            const intervals = [];
            for (let i = 0; i < 5; i++) {
                const result = reviewWord(4, 5);
                levels.push(result.newLevel);
                intervals.push(result.nextReviewDays);
            }

            console.log(`   📊 Уровни: ${levels.join(' → ')}`);
            console.log(`   📅 Интервалы: ${intervals.join(' → ')} дней`);

            expect(levels).toEqual([1, 2, 3, 4, 5]);
            expect(intervals).toEqual([1, 3, 7, 14, 30]);
            console.log('   ✅ Полный цикл пройден!\n');
        });
    });

    describe('📅 Доступность слов', () => {

        it('Слово с next_review = завтра — ДОСТУПНО (запас +1 день)', () => {
            console.log('\n--- Тест 8: Доступность "завтрашнего" слова ---');
            db.prepare("UPDATE words SET next_review = date('now', '+1 day') WHERE id = 1").run();
            console.log('   📅 Установлен next_review = завтра');

            const words = getWordsForStudy();
            const found = words.find(w => w.id === 1);

            console.log(`   🔍 Слово id=1 ${found ? 'найдено ✅' : 'НЕ найдено ❌'}`);
            console.log(`   📋 Всего доступно слов: ${words.length}`);
            expect(found).toBeTruthy();
            console.log('   ✅ Завтрашнее слово доступно!\n');
        });

        it('Слова с датой из прошлого доступны', () => {
            db.prepare("INSERT INTO words (id, user_id, word, translation, level, next_review) VALUES (99, 1, 'Old', 'Старое', 2, '2020-01-01 10:00:00')").run();

            const words = getWordsForStudy();
            const found = words.find(w => w.id === 99);
            expect(found).toBeTruthy();
        });

        it('Слово с next_review = послезавтра — НЕ доступно', () => {
            console.log('\n--- Тест 9: Недоступность "послезавтрашнего" слова ---');
            db.prepare("UPDATE words SET next_review = date('now', '+2 day') WHERE id = 2").run();
            console.log('   📅 Установлен next_review = послезавтра');

            const words = getWordsForStudy();
            const found = words.find(w => w.id === 2);

            console.log(`   🔍 Слово id=2 ${found ? 'найдено ✅' : 'НЕ найдено ❌ (как и должно быть)'}`);
            console.log(`   📋 Всего доступно слов: ${words.length}`);
            expect(found).toBeFalsy();
            console.log('   ✅ Послезавтрашнее слово недоступно!\n');
        });

        it('Новые слова (level 0) — ВСЕГДА доступны', () => {
            console.log('\n--- Тест 10: Доступность новых слов ---');
            db.prepare("INSERT INTO words (id, user_id, word, translation, level, next_review) VALUES (5, 1, 'Bird', 'Птица', 0, datetime('now'))").run();
            console.log('   🆕 Создано слово "Bird" с level=0');

            const words = getWordsForStudy();
            const found = words.find(w => w.id === 5);

            console.log(`   🔍 Слово id=5 ${found ? 'найдено ✅' : 'НЕ найдено ❌'}`);
            console.log(`   📋 Всего доступно слов: ${words.length}`);
            expect(found).toBeTruthy();
            console.log('   ✅ Новые слова всегда доступны!\n');
        });
    });
});

afterAll(() => {
    db.close();
    if (fs.existsSync(TEST_DB)) {
        fs.unlinkSync(TEST_DB);
        try { fs.unlinkSync(TEST_DB + '-shm'); } catch { }
        try { fs.unlinkSync(TEST_DB + '-wal'); } catch { }
    }
    console.log('🧹 Тестовая БД удалена');
    console.log('🧠 ТЕСТЫ ИНТЕРВАЛЬНОГО ПОВТОРЕНИЯ ЗАВЕРШЕНЫ\n');
});