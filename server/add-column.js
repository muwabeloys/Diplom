import Database from 'better-sqlite3';

const db = new Database('./data/app.db');

try {
    db.exec("ALTER TABLE words ADD COLUMN example_translation TEXT DEFAULT ''");
    console.log('Колонка example_translation добавлена');
} catch (e) {
    console.log('Колонка уже существует или ошибка:', e.message);
}