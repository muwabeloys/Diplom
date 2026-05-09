import Database from 'better-sqlite3';

const db = new Database('./data/app.db');

db.exec("UPDATE words SET next_review = datetime('now', '-1 day') WHERE level = 0");

const count = db.prepare("SELECT COUNT(*) as count FROM words WHERE next_review <= datetime('now')").get();

console.log('Слов доступно:', count.count);