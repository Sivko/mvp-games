FROM python:3.11-slim

# Устанавливаем переменные окружения для UTF-8
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf-8
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py watcher.py .

# Копируем папку data (модель будет монтироваться через volume в docker-compose)
# COPY ../data /app/data

# Default command runs with hot reload
CMD ["python", "watcher.py"]

