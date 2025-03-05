FROM node:18-alpine

WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Открываем порт (если нужно)
# EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]
