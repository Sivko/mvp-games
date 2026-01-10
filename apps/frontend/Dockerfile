FROM nginx:alpine

# Копируем собранные файлы из dist в nginx директорию
# Vite уже копирует файлы из public в корень dist при сборке
COPY apps/frontend/dist /usr/share/nginx/html

# Устанавливаем правильные права доступа для nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Копируем конфигурацию nginx для SPA роутинга
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# nginx запускается автоматически при старте контейнера
CMD ["nginx", "-g", "daemon off;"]

