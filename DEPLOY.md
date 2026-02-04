# Деплой на Railway

Инструкция по развертыванию приложения "Анжелика: Управление гостевым домом" на Railway.

## Подготовка

### 1. Получить Gemini API Key

1. Перейдите на https://ai.google.dev
2. Войдите в аккаунт Google
3. Создайте новый API ключ
4. Скопируйте ключ

### 2. Установить Railway CLI (опционально)

```bash
# macOS
brew install railway

# npm
npm i -g @railway/cli

# Логин
railway login
```

## Деплой через Railway Web UI

### Способ 1: Через GitHub (рекомендуется)

1. **Создать GitHub репозиторий:**
   ```bash
   cd anzhelika-guesthouse
   git remote add origin https://github.com/ваш-username/anzhelika-guesthouse.git
   git branch -M main
   git push -u origin main
   ```

2. **Деплой на Railway:**
   - Откройте https://railway.app
   - Нажмите "New Project" → "Deploy from GitHub repo"
   - Выберите репозиторий `anzhelika-guesthouse`
   - Railway автоматически определит Vite-проект

3. **Настроить переменные окружения:**
   - Перейдите в проект → Settings → Variables
   - Добавьте переменную:
     ```
     GEMINI_API_KEY=ваш_ключ_здесь
     ```

4. **Дождаться деплоя:**
   - Railway автоматически соберет и задеплоит приложение
   - Получите URL: `https://ваш-проект.railway.app`

### Способ 2: Через Railway CLI

```bash
# В директории проекта
cd anzhelika-guesthouse

# Инициализировать проект
railway init

# Добавить переменные окружения
railway variables set GEMINI_API_KEY=ваш_ключ_здесь

# Деплой
railway up

# Открыть в браузере
railway open
```

## Настройки Railway

После деплоя можно настроить:

### Кастомный домен

1. Settings → Networking → Custom Domain
2. Добавить домен: `anzhelika.yourdomain.com`
3. Настроить DNS (CNAME запись)

### Переменные окружения

```env
GEMINI_API_KEY=your_actual_gemini_api_key
NODE_ENV=production
```

### Health Check

Railway автоматически проверяет `/` каждые 100 секунд.

## Локальная разработка

```bash
# Установить зависимости
npm install

# Скопировать .env
cp .env.example .env.local

# Заполнить GEMINI_API_KEY в .env.local
nano .env.local

# Запустить dev-сервер
npm run dev

# Откроется на http://localhost:3000
```

## Структура файлов деплоя

```
anzhelika-guesthouse/
├── railway.json      # Конфигурация Railway
├── nixpacks.toml     # Билдер Railway
├── vite.config.ts    # Поддержка переменной PORT
├── .env.example      # Шаблон переменных
└── package.json      # Скрипты: dev, build, preview
```

## Проверка деплоя

После успешного деплоя:

1. Откройте URL проекта
2. Проверьте работу календаря бронирований
3. Проверьте сохранение данных в localStorage
4. Убедитесь, что Gemini API работает (если используется в приложении)

## Troubleshooting

### Ошибка "Module not found"
```bash
# Очистить кэш и пересобрать
railway run npm run build
railway up --detach
```

### Приложение не запускается
Проверьте логи:
```bash
railway logs
```

### Неверный порт
Убедитесь, что `vite.config.ts` использует `process.env.PORT`:
```typescript
const port = parseInt(process.env.PORT || '3000', 10);
```

## Альтернативные платформы

Приложение также можно задеплоить на:
- **Vercel:** `vercel --prod`
- **Netlify:** `netlify deploy --prod`
- **Render:** Через GitHub integration

## Стоимость

Railway:
- **Free tier:** $5 бесплатных кредитов/месяц
- **Hobby Plan:** $5/месяц за проект
- Vite-приложение потребляет ~$2-5/месяц

## Обновления

При изменении кода:
```bash
git add .
git commit -m "Update app"
git push

# Railway автоматически задеплоит изменения
```

## Поддержка

- Railway Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
