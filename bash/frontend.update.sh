#!/bin/bash

# Устанавливаем путь скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Переходим в родительскую директорию
cd "$SCRIPT_DIR/../" || exit 1

# Параметры подключения
REMOTE_HOST="root@77.222.52.134"
REMOTE_PATH="/root/mvp-games"

# Имя Docker образа
IMAGE_NAME="frontend"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

# Имя архива
ARCHIVE_NAME="frontend-image.tar"

# Собираем frontend проект
echo "Сборка frontend проекта (production mode)..."
cd apps/frontend || exit 1
npm run build-production

if [ $? -ne 0 ]; then
  echo "✗ Ошибка при сборке frontend проекта"
  exit 1
fi

echo "✓ Frontend проект успешно собран"

# Возвращаемся в корневую директорию
cd ../..

echo "Сборка Docker образа для платформы linux/amd64..."

# Собираем Docker образ для платформы amd64
docker buildx build \
  --platform linux/amd64 \
  -t "$FULL_IMAGE_NAME" \
  -f ./apps/frontend/Dockerfile \
  --load \
  .

if [ $? -ne 0 ]; then
  echo "✗ Ошибка при сборке Docker образа"
  exit 1
fi

echo "✓ Docker образ успешно собран"

# Сохраняем образ в tar файл
echo "Сохранение образа в архив $ARCHIVE_NAME..."
docker save -o "$ARCHIVE_NAME" "$FULL_IMAGE_NAME"

if [ $? -ne 0 ]; then
  echo "✗ Ошибка при сохранении образа в архив"
  exit 1
fi

echo "✓ Образ сохранен в $ARCHIVE_NAME"

# Отправляем архив на сервер
echo "Отправка архива на сервер $REMOTE_HOST:$REMOTE_PATH..."
scp "$ARCHIVE_NAME" "$REMOTE_HOST:$REMOTE_PATH/"

if [ $? -ne 0 ]; then
  echo "✗ Ошибка при отправке архива"
  rm "$ARCHIVE_NAME"
  exit 1
fi

echo "✓ Архив успешно отправлен"

# Загружаем образ на сервере
echo "Загрузка образа на сервере..."
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && docker load -i $ARCHIVE_NAME"

if [ $? -ne 0 ]; then
  echo "✗ Ошибка при загрузке образа на сервере"
  rm "$ARCHIVE_NAME"
  exit 1
fi

echo "✓ Образ успешно загружен на сервере"

# Удаляем локальный архив
rm "$ARCHIVE_NAME"
echo "✓ Локальный архив удален"

# Удаляем архив на сервере (опционально)
echo "Удаление архива на сервере..."
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && rm -f $ARCHIVE_NAME"

# Перезапускаем контейнер с новым образом
echo "Перезапуск контейнера frontend..."
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && cd ../ && docker compose up -d frontend"

if [ $? -ne 0 ]; then
  echo "✗ Ошибка при перезапуске контейнера"
  exit 1
fi

echo "✓ Контейнер frontend успешно перезапущен"

echo "Готово! Docker образ $FULL_IMAGE_NAME загружен на сервер и контейнер перезапущен"

