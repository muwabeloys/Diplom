# 📡 API Documentation — Language Learning App  

Базовый URL: `http://localhost:5000/api`

---

## 🔐 Аутентификация

Все эндпоинты, кроме регистрации и входа, требуют заголовок:  
Authorization: Bearer <токен>  

---

## 1. Регистрация  

### `POST /api/auth/register`  

**Тело запроса:**
{  
  "username": "student",  
  "email": "student@test.com",  
  "password": "123456"  
}  

### Успешный ответ (201): 
{  
  "message": "Регистрация успешна",  
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  
  "user": {  
    "id": 1,  
    "username": "student",  
    "email": "student@test.com"  
  }  
}

### Ошибки:
// 400 Bad Request  
{ "error": "Все поля обязательны" }  
{ "error": "Пароль минимум 6 символов" }  
{ "error": "Email или имя пользователя уже заняты" }  
{ "error": "Имя пользователя минимум 3 символа" }  
{ "error": "Некорректный email" }  

## 2. Вход в систему

### `POST /api/auth/login`

**Тело запроса:**  
{  
  "email": "student@test.com",  
  "password": "123456"  
}  

## Успешный ответ (200):
{  
  "message": "Вход выполнен",  
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  
  "user": {  
    "id": 1,  
    "username": "student",  
    "email": "student@test.com",  
    "daily_goal": 20  
  }  
}

### Ошибки:
// 401 Unauthorized  
{ "error": "Неверный email или пароль" }  
  
// 400 Bad Request  
{ "error": "Email и пароль обязательны" }  

## 3. Профиль пользователя

### `GET /api/auth/profile`
Требуется токен: ✅

**Заголовок:** Authorization: Bearer eyJhbGciOiJIUzI1NiIs...  

### Успешный ответ (200):
{  
  "user": {  
    "id": 1,  
    "username": "student",  
    "email": "student@test.com",  
    "daily_goal": 20,  
    "created_at": "2025-04-25 10:20:36",  
    "stats": {  
      "total_words": 30,  
      "learned_words": 0,  
      "words_to_review": 30  
    }  
  }  
}

### Ошибки:
// 401 Unauthorized  
{ "error": "Требуется авторизация" }  
{ "error": "Токен недействителен или истек" }  
  
// 404 Not Found  
{ "error": "Пользователь не найден" }

## 4.Получить слова для изучения

### `GET /api/words/study`  
Требуется токен: ✅  

### Пример запроса:
GET /api/words/study?language=en&limit=5  

### Успешный ответ (200):
{  
  "words": [  
    {  
      "id": 1,  
      "word": "Hello",  
      "translation": "Привет",  
      "example": "Hello, how are you?",  
      "category": "basics",  
      "level": 0,  
      "review_count": 0  
    },  
    {  
      "id": 2,  
      "word": "Goodbye",  
      "translation": "До свидания",  
      "example": "Goodbye, see you later!",  
      "category": "basics",  
      "level": 0,  
      "review_count": 0  
    }  
  ],  
  "stats": {  
    "total": 30,  
    "learned": 0,  
    "due": 30  
  }  
}

**Примечание:** Возвращает только слова, у которых next_review <= текущая дата (слова на сегодня).  

## 5. Добавить новое слово

### `POST /api/words`
Требуется токен: ✅  

### Тело запроса:
{  
  "language": "en",  
  "word": "Dog",  
  "translation": "Собака",  
  "example": "I have a dog",  
  "category": "basics"  
}


|Поле	    |Тип   |Обязательно|По умолчанию|Описание            |
|-----------|------|-----------|------------|--------------------| 
|language	|string|Нет        |en	        |Язык                |
|word	    |string|Да         |—	        |Иностранное слово   |
|translation|string|Да	       |—	        |Перевод             | 
|example	|string|Нет	       |""	        |Пример использования|
|category	|string|Нет	       |basics	    |Категория           |

### Успешный ответ (201):
{  
  "message": "Слово успешно добавлено"  
}

### Ошибки:
// 400 Bad Request  
{ "error": "Слово и перевод обязательны" }  
{ "error": "Такое слово уже существует" }

## 6.Оценить слово

### `PUT /api/words/:id/review`
Требуется токен: ✅

**Парметры пути:**
|Параметр|Описание               |
|--------|-----------------------|
|id      |ID слова из базы данных|

### Тело запроса:
{  
  "quality": 5  
}  

**Оценки(quality):**
|Значение|Описание|Эффект                      |
|--------|--------|----------------------------|
|0       |Сложно  |Уровень -1, повторить скоро |
|1       |        |                            |
|2       |Не очень|Уровень не меняется         |
|3       |        |                            |
|4       |Хорошо  |Уровень +1                  |
|5       |Отлично |Уровень +1, длинный интервал|

### Успешный ответ (200):
{  
  "success": true,  
  "new_level": 1,  
  "next_review_days": 1,  
  "message": "Отлично!"  
}  

**Уровни и интервалы:**
|Уровень|Интервал|Когда повторить|
|-------|--------|---------------|
|0      |0 дней  |Новое слово    | 
|1      |1 день  |Завтра         |
|2      |3 дня   |Через 3 дня    |
|3      |7 дней  |Через неделю   |
|4      |14 дней |Через 2 недели |
|5      |30 дней |Через месяц    |

### Ошибки:
// 400 Bad Request  
{ "error": "Оценка должна быть от 0 до 5" }  
  
// 404 Not Found  
{ "error": "Слово не найдено" }  

## 7. Получить категории

### `GET /api/words/categories`
Требуется токен: ✅

### Пример запроса:
GET /api/words/categories?language=en  

### Успешный ответ (200):
{  
  "categories": [  
    {  
      "category": "basics",  
      "total": 10,  
      "learned": 1  
    },  
    {  
      "category": "food",  
      "total": 5,  
      "learned": 0  
    },  
    {  
      "category": "travel",  
      "total": 5,  
      "learned": 0  
    },  
    {  
      "category": "work",  
      "total": 5,  
      "learned": 2  
    },  
    {  
      "category": "hobbies",  
      "total": 5,  
      "learned": 0  
    }  
  ]  
}

**📊 Категории слов**
|Категория|Описание      |
|---------|--------------|
|basics   |Основные фразы|
|food     |Еда и напитки | 
|travel   |Путешествия   |
|work     |Работа и офис |
|hobbies  |Хобби и досуг |