import db from './config/database.js';

export const seedStarterWords = (userId) => {
    const words = [
        // Основы
        { word: 'Hello', translation: 'Привет', example: 'Hello, how are you?', category: 'basics' },
        { word: 'Goodbye', translation: 'До свидания', example: 'Goodbye, see you later!', category: 'basics' },
        { word: 'Thank you', translation: 'Спасибо', example: 'Thank you very much!', category: 'basics' },
        { word: 'Please', translation: 'Пожалуйста', example: 'Could you help me, please?', category: 'basics' },
        { word: 'Sorry', translation: 'Извините', example: 'I\'m sorry for being late', category: 'basics' },
        { word: 'Yes', translation: 'Да', example: 'Yes, I would love to!', category: 'basics' },
        { word: 'No', translation: 'Нет', example: 'No, thank you', category: 'basics' },
        { word: 'Good morning', translation: 'Доброе утро', example: 'Good morning, everyone!', category: 'basics' },
        { word: 'Good night', translation: 'Спокойной ночи', example: 'Good night, sleep well', category: 'basics' },
        { word: 'How are you?', translation: 'Как дела?', example: 'Hi! How are you today?', category: 'basics' },

        // Еда
        { word: 'Water', translation: 'Вода', example: 'Can I have some water?', category: 'food' },
        { word: 'Bread', translation: 'Хлеб', example: 'Fresh bread from the bakery', category: 'food' },
        { word: 'Coffee', translation: 'Кофе', example: 'I need coffee in the morning', category: 'food' },
        { word: 'Tea', translation: 'Чай', example: 'Would you like some tea?', category: 'food' },
        { word: 'Milk', translation: 'Молоко', example: 'I drink milk every day', category: 'food' },

        // Путешествия
        { word: 'Airport', translation: 'Аэропорт', example: 'Where is the airport?', category: 'travel' },
        { word: 'Hotel', translation: 'Отель', example: 'The hotel is very comfortable', category: 'travel' },
        { word: 'Ticket', translation: 'Билет', example: 'I need to buy a ticket', category: 'travel' },
        { word: 'Train', translation: 'Поезд', example: 'The train arrives at 5 PM', category: 'travel' },
        { word: 'Map', translation: 'Карта', example: 'Do you have a map of the city?', category: 'travel' },

        // Работа
        { word: 'Computer', translation: 'Компьютер', example: 'I work on my computer', category: 'work' },
        { word: 'Meeting', translation: 'Встреча', example: 'The meeting is at 3 PM', category: 'work' },
        { word: 'Office', translation: 'Офис', example: 'I go to the office every day', category: 'work' },
        { word: 'Email', translation: 'Электронная почта', example: 'I sent you an email', category: 'work' },
        { word: 'Project', translation: 'Проект', example: 'We finished the project', category: 'work' },

        // Хобби
        { word: 'Book', translation: 'Книга', example: 'I love reading books', category: 'hobbies' },
        { word: 'Music', translation: 'Музыка', example: 'I listen to music every day', category: 'hobbies' },
        { word: 'Movie', translation: 'Фильм', example: 'Let\'s watch a movie tonight', category: 'hobbies' },
        { word: 'Sport', translation: 'Спорт', example: 'I do sport twice a week', category: 'hobbies' },
        { word: 'Game', translation: 'Игра', example: 'This game is very fun', category: 'hobbies' }
    ];

    const insert = db.prepare(`
    INSERT INTO words (user_id, language, word, translation, example, category)
    VALUES (?, 'en', ?, ?, ?, ?)
  `);

    const insertAll = db.transaction(() => {
        for (const w of words) {
            insert.run(userId, w.word, w.translation, w.example, w.category);
        }
    });

    insertAll();
    console.log(`Добавлено ${words.length} стартовых слов для пользователя ${userId}`);
};