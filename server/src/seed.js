import db from './config/database.js';

export const seedStarterWords = (userId) => {
    const words = [
        { word: 'Hello', translation: 'Привет', example: 'Hello, how are you?', exampleTranslation: 'Привет, как дела?', category: 'basics' },
        { word: 'Goodbye', translation: 'До свидания', example: 'Goodbye, see you later!', exampleTranslation: 'До свидания, увидимся позже!', category: 'basics' },
        { word: 'Thank you', translation: 'Спасибо', example: 'Thank you very much!', exampleTranslation: 'Большое спасибо!', category: 'basics' },
        { word: 'Please', translation: 'Пожалуйста', example: 'Could you help me, please?', exampleTranslation: 'Не могли бы вы помочь мне, пожалуйста?', category: 'basics' },
        { word: 'Sorry', translation: 'Извините', example: 'I\'m sorry for being late', exampleTranslation: 'Извините за опоздание', category: 'basics' },
        { word: 'Yes', translation: 'Да', example: 'Yes, I would love to!', exampleTranslation: 'Да, с удовольствием!', category: 'basics' },
        { word: 'No', translation: 'Нет', example: 'No, thank you', exampleTranslation: 'Нет, спасибо', category: 'basics' },
        { word: 'Good morning', translation: 'Доброе утро', example: 'Good morning, everyone!', exampleTranslation: 'Доброе утро всем!', category: 'basics' },
        { word: 'Good night', translation: 'Спокойной ночи', example: 'Good night, sleep well', exampleTranslation: 'Спокойной ночи, спи хорошо', category: 'basics' },
        { word: 'How are you?', translation: 'Как дела?', example: 'Hi! How are you today?', exampleTranslation: 'Привет! Как ты сегодня?', category: 'basics' },

        { word: 'Water', translation: 'Вода', example: 'Can I have some water?', exampleTranslation: 'Можно мне воды?', category: 'food' },
        { word: 'Bread', translation: 'Хлеб', example: 'Fresh bread from the bakery', exampleTranslation: 'Свежий хлеб из пекарни', category: 'food' },
        { word: 'Coffee', translation: 'Кофе', example: 'I need coffee in the morning', exampleTranslation: 'Мне нужен кофе утром', category: 'food' },
        { word: 'Tea', translation: 'Чай', example: 'Would you like some tea?', exampleTranslation: 'Хочешь чаю?', category: 'food' },
        { word: 'Milk', translation: 'Молоко', example: 'I drink milk every day', exampleTranslation: 'Я пью молоко каждый день', category: 'food' },

        { word: 'Airport', translation: 'Аэропорт', example: 'Where is the airport?', exampleTranslation: 'Где аэропорт?', category: 'travel' },
        { word: 'Hotel', translation: 'Отель', example: 'The hotel is very comfortable', exampleTranslation: 'Отель очень удобный', category: 'travel' },
        { word: 'Ticket', translation: 'Билет', example: 'I need to buy a ticket', exampleTranslation: 'Мне нужно купить билет', category: 'travel' },
        { word: 'Train', translation: 'Поезд', example: 'The train arrives at 5 PM', exampleTranslation: 'Поезд прибывает в 17:00', category: 'travel' },
        { word: 'Map', translation: 'Карта', example: 'Do you have a map of the city?', exampleTranslation: 'У вас есть карта города?', category: 'travel' },

        { word: 'Computer', translation: 'Компьютер', example: 'I work on my computer', exampleTranslation: 'Я работаю за компьютером', category: 'work' },
        { word: 'Meeting', translation: 'Встреча', example: 'The meeting is at 3 PM', exampleTranslation: 'Встреча в 15:00', category: 'work' },
        { word: 'Office', translation: 'Офис', example: 'I go to the office every day', exampleTranslation: 'Я хожу в офис каждый день', category: 'work' },
        { word: 'Email', translation: 'Электронная почта', example: 'I sent you an email', exampleTranslation: 'Я отправил тебе письмо', category: 'work' },
        { word: 'Project', translation: 'Проект', example: 'We finished the project', exampleTranslation: 'Мы закончили проект', category: 'work' },

        { word: 'Book', translation: 'Книга', example: 'I love reading books', exampleTranslation: 'Я люблю читать книги', category: 'hobbies' },
        { word: 'Music', translation: 'Музыка', example: 'I listen to music every day', exampleTranslation: 'Я слушаю музыку каждый день', category: 'hobbies' },
        { word: 'Movie', translation: 'Фильм', example: 'Let\'s watch a movie tonight', exampleTranslation: 'Давай посмотрим фильм сегодня вечером', category: 'hobbies' },
        { word: 'Sport', translation: 'Спорт', example: 'I do sport twice a week', exampleTranslation: 'Я занимаюсь спортом дважды в неделю', category: 'hobbies' },
        { word: 'Game', translation: 'Игра', example: 'This game is very fun', exampleTranslation: 'Эта игра очень весёлая', category: 'hobbies' }
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