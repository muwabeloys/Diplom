import Database from 'better-sqlite3';

const db = new Database('./data/app.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS grammar_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language TEXT NOT NULL DEFAULT 'en',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    examples TEXT DEFAULT '[]',
    category TEXT DEFAULT 'general',
    level TEXT DEFAULT 'beginner',
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Таблица grammar_rules создана');