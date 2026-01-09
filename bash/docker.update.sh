#!/bin/bash

# Устанавливаем путь скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Переходим в родительскую директорию
cd "$SCRIPT_DIR/../" || exit 1

# Параметры подключения
REMOTE_HOST="root@77.223.97.101"
REMOTE_PATH="/root/mvp-games"

# Файлы и папки для отправки
FILES=(
  "docker-compose.production.yml"
  ".env.production"
  "traefik"
)

echo "Отправка файлов на сервер $REMOTE_HOST:$REMOTE_PATH..."

# Отправляем файлы
for item in "${FILES[@]}"; do
  if [ -e "$item" ]; then
    echo "Отправка: $item"
    scp -r "$item" "$REMOTE_HOST:$REMOTE_PATH/"
    if [ $? -eq 0 ]; then
      echo "✓ $item успешно отправлен"
    else
      echo "✗ Ошибка при отправке $item"
      exit 1
    fi
  else
    echo "⚠ Предупреждение: $item не найден"
  fi
done

echo "Все файлы успешно отправлены!"

# Создаем .env файл из .env.production на сервере для docker-compose
echo "Создание .env файла из .env.production на сервере..."
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && cp .env.production .env"

# Создаем docker-compose.yml из docker-compose.production.yml
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && cp docker-compose.production.yml docker-compose.yml"


if [ $? -eq 0 ]; then
  echo "✓ Файл .env создан на сервере"
else
  echo "✗ Ошибка при создании .env файла"
  exit 1
fi

