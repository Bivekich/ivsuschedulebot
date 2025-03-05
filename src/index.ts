import 'reflect-metadata';
import { initializeDatabase } from './database/data-source';
import { startBot } from './bot';

// Функция для запуска приложения
const bootstrap = async () => {
  try {
    // Инициализируем подключение к базе данных
    await initializeDatabase();

    // Запускаем телеграм-бота
    await startBot();
  } catch (error) {
    console.error('Ошибка при запуске приложения:', error);
    process.exit(1);
  }
};

// Запускаем приложение
bootstrap();
