import db from './config/database.js';

const rules = [
    {
        language: 'en',
        title: 'Present Simple',
        description: 'Настоящее простое время. Используется для регулярных действий, фактов и привычек.',
        examples: JSON.stringify([
            { en: 'I work every day.', ru: 'Я работаю каждый день.' },
            { en: 'She lives in London.', ru: 'Она живёт в Лондоне.' },
            { en: 'They don\'t speak French.', ru: 'Они не говорят по-французски.' },
            { en: 'Do you like coffee?', ru: 'Ты любишь кофе?' }
        ]),
        category: 'tenses',
        level: 'beginner',
        order_index: 1
    },
    {
        language: 'en',
        title: 'Present Continuous',
        description: 'Настоящее длительное время. Используется для действий, происходящих прямо сейчас или в текущий период.',
        examples: JSON.stringify([
            { en: 'I am reading a book.', ru: 'Я читаю книгу (сейчас).' },
            { en: 'She is working on a project.', ru: 'Она работает над проектом.' },
            { en: 'They are playing football.', ru: 'Они играют в футбол.' }
        ]),
        category: 'tenses',
        level: 'beginner',
        order_index: 2
    },
    {
        language: 'en',
        title: 'Past Simple',
        description: 'Прошедшее простое время. Используется для завершённых действий в прошлом.',
        examples: JSON.stringify([
            { en: 'I visited London last year.', ru: 'Я посетил Лондон в прошлом году.' },
            { en: 'She didn\'t come to the party.', ru: 'Она не пришла на вечеринку.' },
            { en: 'Did you see that movie?', ru: 'Ты видел тот фильм?' }
        ]),
        category: 'tenses',
        level: 'beginner',
        order_index: 3
    },
    {
        language: 'en',
        title: 'Articles: A/An и The',
        description: 'Артикли в английском языке. A/An — неопределённый артикль (один из многих). The — определённый артикль (конкретный предмет).',
        examples: JSON.stringify([
            { en: 'I have a cat.', ru: 'У меня есть кот (один из многих).' },
            { en: 'The cat is black.', ru: '(Этот) кот — чёрный.' },
            { en: 'She is an engineer.', ru: 'Она инженер.' },
            { en: 'The sun is bright.', ru: 'Солнце яркое (уникальный объект).' }
        ]),
        category: 'articles',
        level: 'beginner',
        order_index: 4
    },
    {
        language: 'en',
        title: 'Prepositions of Place',
        description: 'Предлоги места: in (внутри), on (на поверхности), at (в точке), under (под), between (между).',
        examples: JSON.stringify([
            { en: 'The book is on the table.', ru: 'Книга на столе.' },
            { en: 'She is in the room.', ru: 'Она в комнате.' },
            { en: 'I am at home.', ru: 'Я дома.' },
            { en: 'The cat is under the chair.', ru: 'Кот под стулом.' }
        ]),
        category: 'prepositions',
        level: 'beginner',
        order_index: 5
    },
    {
        language: 'en',
        title: 'Future Simple',
        description: 'Будущее простое время. Will + глагол. Для предсказаний, обещаний и спонтанных решений.',
        examples: JSON.stringify([
            { en: 'I will call you tomorrow.', ru: 'Я позвоню тебе завтра.' },
            { en: 'It will rain today.', ru: 'Сегодня будет дождь.' },
            { en: 'Will you help me?', ru: 'Ты поможешь мне?' }
        ]),
        category: 'tenses',
        level: 'intermediate',
        order_index: 6
    },
    {
        language: 'en',
        title: 'Present Perfect',
        description: 'Настоящее совершённое время. Have/has + 3-я форма глагола. Связь прошлого с настоящим.',
        examples: JSON.stringify([
            { en: 'I have finished my work.', ru: 'Я закончил работу (результат сейчас).' },
            { en: 'She has never been to Paris.', ru: 'Она никогда не была в Париже.' },
            { en: 'Have you ever eaten sushi?', ru: 'Ты когда-нибудь ел суши?' }
        ]),
        category: 'tenses',
        level: 'intermediate',
        order_index: 7
    },
    {
        language: 'en',
        title: 'Modal Verbs',
        description: 'Модальные глаголы: can (мочь), must (должен), should (следует), may (можно). Не изменяются по лицам.',
        examples: JSON.stringify([
            { en: 'I can swim.', ru: 'Я умею плавать.' },
            { en: 'You must stop here.', ru: 'Ты должен остановиться здесь.' },
            { en: 'You should see a doctor.', ru: 'Тебе следует обратиться к врачу.' }
        ]),
        category: 'verbs',
        level: 'intermediate',
        order_index: 8
    },
    {
        language: 'en',
        title: 'Conditionals (Zero and First)',
        description: 'Условные предложения. Zero Conditional: If + Present Simple, Present Simple (факт). First Conditional: If + Present Simple, will + verb (реальное условие).',
        examples: JSON.stringify([
            { en: 'If you heat water, it boils.', ru: 'Если нагревать воду, она закипает.' },
            { en: 'If it rains, I will stay home.', ru: 'Если пойдёт дождь, я останусь дома.' }
        ]),
        category: 'conditionals',
        level: 'intermediate',
        order_index: 9
    },
    {
        language: 'en',
        title: 'Passive Voice',
        description: 'Пассивный залог: be + 3-я форма глагола. Используется, когда важнее действие, а не кто его совершил.',
        examples: JSON.stringify([
            { en: 'This house was built in 1900.', ru: 'Этот дом был построен в 1900 году.' },
            { en: 'English is spoken worldwide.', ru: 'На английском говорят во всём мире.' }
        ]),
        category: 'verbs',
        level: 'advanced',
        order_index: 10
    }
];

export const seedGrammarRules = () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM grammar_rules').get();
    if (count.count > 0) return;

    const insert = db.prepare(`
    INSERT INTO grammar_rules (language, title, description, examples, category, level, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    const insertAll = db.transaction(() => {
        for (const r of rules) {
            insert.run(r.language, r.title, r.description, r.examples, r.category, r.level, r.order_index);
        }
    });

    insertAll();
    console.log(`Добавлено ${rules.length} грамматических правил`);
};