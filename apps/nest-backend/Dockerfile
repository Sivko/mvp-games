FROM node:20-alpine

WORKDIR /app

# Копируем готовые файлы без установки зависимостей
COPY apps/nest-backend/package.json apps/nest-backend/package-lock.json ./
COPY apps/nest-backend/node_modules ./node_modules
COPY apps/nest-backend/dist ./dist
COPY apps/nest-backend/public ./public

# Устанавливаем переменные окружения
ENV NODE_ENV=production

# Открываем порт (будет переопределен через docker-compose)
EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/main"]

