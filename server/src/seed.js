import db from './config/database.js';

export const seedStarterWords = (userId) => {
    const words = [
        { word: 'Hello', translation: 'Привет', example: 'Hello, how are you?', example_translation: 'Привет, как дела?', category: 'basics' },
        { word: 'Goodbye', translation: 'До свидания', example: 'Goodbye, see you later!', example_translation: 'До свидания, увидимся позже!', category: 'basics' },
        { word: 'Thank you', translation: 'Спасибо', example: 'Thank you very much!', example_translation: 'Большое спасибо!', category: 'basics' },
        { word: 'Please', translation: 'Пожалуйста', example: 'Could you help me, please?', example_translation: 'Не могли бы вы помочь мне, пожалуйста?', category: 'basics' },
        { word: 'Sorry', translation: 'Извините', example: 'I\'m sorry for being late', example_translation: 'Извините за опоздание', category: 'basics' },
        { word: 'Yes', translation: 'Да', example: 'Yes, I would love to!', example_translation: 'Да, с удовольствием!', category: 'basics' },
        { word: 'No', translation: 'Нет', example: 'No, thank you', example_translation: 'Нет, спасибо', category: 'basics' },
        { word: 'Good morning', translation: 'Доброе утро', example: 'Good morning, everyone!', example_translation: 'Доброе утро всем!', category: 'basics' },
        { word: 'Good night', translation: 'Спокойной ночи', example: 'Good night, sleep well', example_translation: 'Спокойной ночи, спи хорошо', category: 'basics' },
        { word: 'How are you?', translation: 'Как дела?', example: 'Hi! How are you today?', example_translation: 'Привет! Как ты сегодня?', category: 'basics' },
        { word: 'Water', translation: 'Вода', example: 'Can I have some water?', example_translation: 'Можно мне воды?', category: 'food' },
        { word: 'Bread', translation: 'Хлеб', example: 'Fresh bread from the bakery', example_translation: 'Свежий хлеб из пекарни', category: 'food' },
        { word: 'Coffee', translation: 'Кофе', example: 'I need coffee in the morning', example_translation: 'Мне нужен кофе утром', category: 'food' },
        { word: 'Tea', translation: 'Чай', example: 'Would you like some tea?', example_translation: 'Хочешь чаю?', category: 'food' },
        { word: 'Milk', translation: 'Молоко', example: 'I drink milk every day', example_translation: 'Я пью молоко каждый день', category: 'food' },
        { word: 'Airport', translation: 'Аэропорт', example: 'Where is the airport?', example_translation: 'Где аэропорт?', category: 'travel' },
        { word: 'Hotel', translation: 'Отель', example: 'The hotel is very comfortable', example_translation: 'Отель очень удобный', category: 'travel' },
        { word: 'Ticket', translation: 'Билет', example: 'I need to buy a ticket', example_translation: 'Мне нужно купить билет', category: 'travel' },
        { word: 'Train', translation: 'Поезд', example: 'The train arrives at 5 PM', example_translation: 'Поезд прибывает в 17:00', category: 'travel' },
        { word: 'Map', translation: 'Карта', example: 'Do you have a map of the city?', example_translation: 'У вас есть карта города?', category: 'travel' },
        { word: 'Computer', translation: 'Компьютер', example: 'I work on my computer', example_translation: 'Я работаю за компьютером', category: 'work' },
        { word: 'Meeting', translation: 'Встреча', example: 'The meeting is at 3 PM', example_translation: 'Встреча в 15:00', category: 'work' },
        { word: 'Office', translation: 'Офис', example: 'I go to the office every day', example_translation: 'Я хожу в офис каждый день', category: 'work' },
        { word: 'Email', translation: 'Электронная почта', example: 'I sent you an email', example_translation: 'Я отправил тебе письмо', category: 'work' },
        { word: 'Project', translation: 'Проект', example: 'We finished the project', example_translation: 'Мы закончили проект', category: 'work' },
        { word: 'Book', translation: 'Книга', example: 'I love reading books', example_translation: 'Я люблю читать книги', category: 'hobbies' },
        { word: 'Music', translation: 'Музыка', example: 'I listen to music every day', example_translation: 'Я слушаю музыку каждый день', category: 'hobbies' },
        { word: 'Movie', translation: 'Фильм', example: 'Let\'s watch a movie tonight', example_translation: 'Давай посмотрим фильм сегодня вечером', category: 'hobbies' },
        { word: 'Sport', translation: 'Спорт', example: 'I do sport twice a week', example_translation: 'Я занимаюсь спортом дважды в неделю', category: 'hobbies' },
        { word: 'Game', translation: 'Игра', example: 'This game is very fun', example_translation: 'Эта игра очень весёлая', category: 'hobbies' }
    ];

    const insert = db.prepare(`
        INSERT INTO words (user_id, language, word, translation, example, example_translation, category)
        VALUES (?, 'en', ?, ?, ?, ?, ?)
    `);

    const insertAll = db.transaction(() => {
        for (const w of words) {
            insert.run(userId, w.word, w.translation, w.example || '', w.example_translation || '', w.category);
        }
    });

    insertAll();
    console.log(`✅ Добавлено ${words.length} стартовых слов для пользователя ${userId}`);
};