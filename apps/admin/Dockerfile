FROM nginx:alpine

# Копируем собранные файлы из dist в nginx директорию
COPY apps/admin/dist /usr/share/nginx/html

# Копируем конфигурацию nginx для SPA роутинга
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# nginx запускается автоматически при старте контейнера
CMD ["nginx", "-g", "daemon off;"]

