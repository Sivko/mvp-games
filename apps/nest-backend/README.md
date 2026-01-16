# NestJS Backend - Word Game

Backend приложение для игры в слова, построенное на NestJS с использованием Domain-Driven Design (DDD) архитектуры.

## Описание

Backend API для многопользовательской игры в слова с поддержкой WebSocket для real-time взаимодействия. Проект использует MongoDB для хранения данных и следует принципам Domain-Driven Design для обеспечения чистоты архитектуры и разделения ответственности.

## Архитектура

Проект организован по принципам DDD (Domain-Driven Design) с разделением на следующие слои:

### Структура модулей

Каждый модуль организован по следующей структуре:

```
{module}/
├── domain/                    # Доменный слой
│   ├── entities/             # Доменные сущности (Aggregates)
│   ├── value-objects/       # Value Objects (неизменяемые объекты)
│   ├── repositories/         # Интерфейсы репозиториев
│   ├── services/            # Доменные сервисы
│   └── events/              # Доменные события
├── application/              # Слой приложения
│   ├── services/            # Application Services (оркестрация use cases)
│   └── dto/                 # Data Transfer Objects (DTOs)
├── infrastructure/           # Инфраструктурный слой
│   ├── persistence/         # Реализация репозиториев (Mongoose)
│   └── schemas/             # Mongoose схемы
└── presentation/             # Слой представления
    └── controllers/         # REST API контроллеры
```

### Основные модули

- **Games** - управление играми, раундами, статистикой
- **Answers** - управление ответами игроков
- **Users** - управление пользователями и Telegram интеграцией
- **Reactions** - управление реакциями на ответы
- **Reaction Types** - типы реакций
- **Bank Association Text** - банк вопросов для игр

## Технологии

- **NestJS** - фреймворк для Node.js
- **MongoDB** - база данных (через Mongoose)
- **Socket.io** - WebSocket для real-time коммуникации
- **class-validator** - валидация DTOs
- **class-transformer** - трансформация объектов
- **Jest** - фреймворк для тестирования
- **TypeScript** - язык программирования

## Установка

```bash
# Установка зависимостей
npm install
```

## Запуск приложения

```bash
# Разработка (с hot-reload)
npm run start:dev

# Production
npm run start:prod

# Debug режим
npm run start:debug
```

## Тестирование

### Запуск всех тестов

```bash
# Запуск всех unit тестов
npm test

# Запуск тестов в watch режиме (автоматический перезапуск при изменениях)
npm run test:watch

# Запуск тестов с покрытием кода
npm run test:cov

# Запуск тестов в debug режиме
npm run test:debug

# Запуск e2e тестов
npm run test:e2e
```

### Структура тестов

Тесты организованы по слоям архитектуры:

- **Domain Layer Tests** (`domain/**/*.spec.ts`)
  - Тесты доменных сущностей и бизнес-логики
  - Тесты Value Objects
  - Тесты доменных сервисов

- **Application Layer Tests** (`application/**/*.spec.ts`)
  - Тесты Application Services с моками репозиториев

- **Presentation Layer Tests** (`presentation/**/*.spec.ts`)
  - Тесты контроллеров с моками Application Services

### Примеры тестов

```bash
# Запуск тестов конкретного модуля
npm test -- games/domain/entities/game.entity.spec.ts

# Запуск тестов с фильтром
npm test -- --testNamePattern="Game Entity"

# Запуск тестов с покрытием для конкретного модуля
npm run test:cov -- games
```

## Переменные окружения

Проект использует переменные окружения для конфигурации. Основные переменные:

- `MONGODB_HOST` - хост MongoDB
- `MONGODB_PORT` - порт MongoDB
- `MONGODB_LOGIN` - логин для MongoDB
- `MONGODB_PASS` - пароль для MongoDB
- `DEFAULT_COUNT_RAUNDS` - количество раундов по умолчанию (по умолчанию: 10)
- `NODE_ENV` - окружение (development/production)

## Основные команды

```bash
# Сборка проекта
npm run build

# Форматирование кода
npm run format

# Линтинг
npm run lint
```

## API Endpoints

### Games
- `POST /games` - создание игры
- `GET /games/:id` - получение игры по ID
- `GET /games/user/:userId/active` - активные игры пользователя
- `GET /games/user/:userId/type/:typeGame` - игра пользователя по типу
- `GET /games/user/:userId/participant` - игры, где пользователь участник
- `GET /games/invite/:inviteUserId/:typeGame` - игра по invite коду

### Answers
- `POST /answers` - создание ответа
- `GET /answers/:id` - получение ответа по ID
- `GET /answers/game/:gameId` - ответы по игре
- `GET /answers/by-question` - ответы по вопросу (с исключением игры)
- `PUT /answers/:id` - обновление ответа
- `DELETE /answers/:id` - удаление ответа

### Users
- `POST /users/find-or-create` - поиск или создание пользователя
- `GET /users/:id` - получение пользователя по ID
- `GET /users` - список всех пользователей

### Reactions
- `POST /reactions` - создание реакции
- `GET /reactions` - список всех реакций
- `GET /reactions/answer/:answerId` - реакции по ответу
- `DELETE /reactions/:id` - удаление реакции

### Reaction Types
- `GET /reaction-types` - список типов реакций
- `POST /reaction-types` - создание типа реакции
- `PUT /reaction-types/:id` - обновление типа реакции
- `DELETE /reaction-types/:id` - удаление типа реакции

### Bank Association Text
- `GET /bank-association-text` - список вопросов
- `POST /bank-association-text` - создание вопроса
- `GET /bank-association-text/:id` - получение вопроса по ID
- `PUT /bank-association-text/:id` - обновление вопроса
- `DELETE /bank-association-text/:id` - удаление вопроса

## WebSocket

Проект использует Socket.io для real-time коммуникации. Gateway находится в `game-association-text/game-association-text.gateway.ts`.

Основные события:
- `join-game` - присоединение к игре
- `submit-answer` - отправка ответа
- `submit-reaction` - отправка реакции
- `ready-for-next-round` - готовность к следующему раунду

## DDD Принципы

Проект следует принципам Domain-Driven Design:

1. **Domain Layer** - содержит бизнес-логику, не зависит от инфраструктуры
2. **Application Layer** - оркестрирует use cases, использует интерфейсы из Domain
3. **Infrastructure Layer** - реализует технические детали (MongoDB, внешние сервисы)
4. **Presentation Layer** - обрабатывает HTTP запросы, использует DTOs

### Value Objects

Используются для инкапсуляции бизнес-правил:
- `GameStatus` - статус игры (active, waiting, finish, disabled)
- `GameType` - тип игры
- `GameStats` - статистика игры
- `AnswerStats` - статистика ответа
- `TelegramUser` - данные Telegram пользователя

### Domain Events

События домена для отслеживания изменений:
- `GameCreatedEvent` - игра создана
- `GameFinishedEvent` - игра завершена
- `RoundIncrementedEvent` - раунд увеличен

## Разработка

### Добавление нового модуля

1. Создать структуру папок по DDD принципам
2. Определить доменные сущности и value objects
3. Создать интерфейсы репозиториев в domain layer
4. Реализовать репозитории в infrastructure layer
5. Создать Application Service
6. Создать DTOs для API
7. Создать контроллер
8. Написать тесты для всех слоев

### Лучшие практики

- Все бизнес-правила должны быть в Domain Layer
- Application Services не должны содержать бизнес-логику, только оркестрацию
- Использовать DTOs для всех входных и выходных данных API
- Писать тесты для всех слоев, особенно Domain Layer
- Использовать Value Objects для инкапсуляции бизнес-правил

## Лицензия

UNLICENSED
