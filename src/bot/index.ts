import { Telegraf, session, Scenes } from 'telegraf';
import * as dotenv from 'dotenv';
import { message } from 'telegraf/filters';
import { UserService } from '../services/user.service';
import { GroupService } from '../services/group.service';
import { ScheduleService } from '../services/schedule.service';
import { AuthService } from '../services/auth.service';
import { mainMenuKeyboard, adminMenuKeyboard } from './keyboards';
import { formatDaySchedule, formatWeekSchedule } from './formatters';
import { getWeekType, getDayOfWeek } from '../utils/date.utils';
import {
  createGroupSelectionScene,
  GROUP_SELECTION_SCENE_ID,
} from './scenes/group-selection.scene';
import {
  createAdminLoginScene,
  ADMIN_LOGIN_SCENE_ID,
} from './scenes/admin-login.scene';
import {
  createGroupManagementScene,
  GROUP_MANAGEMENT_SCENE_ID,
} from './scenes/group-management.scene';
import {
  createScheduleManagementScene,
  SCHEDULE_MANAGEMENT_SCENE_ID,
} from './scenes/schedule-management.scene';
import { addDays } from 'date-fns';

// Загружаем переменные окружения
dotenv.config();

// Создаем экземпляр бота
const bot = new Telegraf<Scenes.SceneContext>(process.env.TELEGRAM_BOT_TOKEN!);

// Инициализируем сервисы
const userService = new UserService();
const groupService = new GroupService();
const scheduleService = new ScheduleService();
const authService = new AuthService();

// Создаем сцены
const groupSelectionScene = createGroupSelectionScene();
const adminLoginScene = createAdminLoginScene();
const groupManagementScene = createGroupManagementScene();
const scheduleManagementScene = createScheduleManagementScene();

// Создаем менеджер сцен
const stage = new Scenes.Stage<Scenes.SceneContext>([
  groupSelectionScene,
  adminLoginScene,
  groupManagementScene,
  scheduleManagementScene,
]);

// Middleware
bot.use(session());
bot.use(stage.middleware());

// Обработка команды /start
bot.start(async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await userService.findByTelegramId(telegramId);

    if (user && user.group) {
      await ctx.reply(
        `Добро пожаловать, ${user.firstName || 'пользователь'}! Ваша группа: ${
          user.group.name
        }`,
        mainMenuKeyboard()
      );
    } else {
      await ctx.reply(
        'Добро пожаловать! Для начала работы выберите вашу группу.'
      );
      await ctx.scene.enter(GROUP_SELECTION_SCENE_ID);
    }
  } catch (error) {
    console.error('Ошибка при обработке команды /start:', error);
    await ctx.reply(
      'Произошла ошибка при запуске бота. Пожалуйста, попробуйте позже.'
    );
  }
});

// Обработка команды /admin
bot.command('admin', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const isAdmin = await authService.isAdmin(telegramId);

    if (isAdmin) {
      await ctx.reply('Вы вошли в панель администратора', adminMenuKeyboard());
    } else {
      await ctx.scene.enter(ADMIN_LOGIN_SCENE_ID);
    }
  } catch (error) {
    console.error('Ошибка при обработке команды /admin:', error);
    await ctx.reply(
      'Произошла ошибка при входе в админку. Пожалуйста, попробуйте позже.'
    );
  }
});

// Обработка команды /group
bot.command('group', async (ctx) => {
  await ctx.scene.enter(GROUP_SELECTION_SCENE_ID);
});

// Обработка кнопки "Расписание на сегодня"
bot.hears('📅 Расписание на сегодня', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await userService.findByTelegramId(telegramId);

    if (!user || !user.group) {
      await ctx.reply('Сначала выберите группу.');
      return ctx.scene.enter(GROUP_SELECTION_SCENE_ID);
    }

    const lessons = await scheduleService.findByGroupForToday(user.groupId);

    if (lessons.length === 0) {
      await ctx.reply(`Сегодня у группы ${user.group.name} нет занятий 🎉`);
    } else {
      const today = new Date();
      const weekDay = getDayOfWeek(today);
      await ctx.reply(formatDaySchedule(lessons, weekDay), {
        parse_mode: 'Markdown',
      });
    }
  } catch (error) {
    console.error('Ошибка при получении расписания на сегодня:', error);
    await ctx.reply(
      'Произошла ошибка при получении расписания. Пожалуйста, попробуйте позже.'
    );
  }
});

// Обработка кнопки "Расписание на завтра"
bot.hears('📆 Расписание на завтра', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await userService.findByTelegramId(telegramId);

    if (!user || !user.group) {
      await ctx.reply('Сначала выберите группу.');
      return ctx.scene.enter(GROUP_SELECTION_SCENE_ID);
    }

    const tomorrow = addDays(new Date(), 1);
    const weekDay = getDayOfWeek(tomorrow);
    const weekType = getWeekType(tomorrow);

    const lessons = await scheduleService.findByGroupAndDay(
      user.groupId,
      weekDay,
      weekType
    );

    if (lessons.length === 0) {
      await ctx.reply(`Завтра у группы ${user.group.name} нет занятий 🎉`);
    } else {
      await ctx.reply(formatDaySchedule(lessons, weekDay), {
        parse_mode: 'Markdown',
      });
    }
  } catch (error) {
    console.error('Ошибка при получении расписания на завтра:', error);
    await ctx.reply(
      'Произошла ошибка при получении расписания. Пожалуйста, попробуйте позже.'
    );
  }
});

// Обработка кнопки "Расписание на неделю"
bot.hears('📚 Расписание на неделю', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await userService.findByTelegramId(telegramId);

    if (!user || !user.group) {
      await ctx.reply('Сначала выберите группу.');
      return ctx.scene.enter(GROUP_SELECTION_SCENE_ID);
    }

    const today = new Date();
    const weekType = getWeekType(today);

    const scheduleByDay = await scheduleService.findByGroupForCurrentWeek(
      user.groupId
    );

    await ctx.reply(formatWeekSchedule(scheduleByDay, weekType), {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('Ошибка при получении расписания на неделю:', error);
    await ctx.reply(
      'Произошла ошибка при получении расписания. Пожалуйста, попробуйте позже.'
    );
  }
});

// Обработка кнопки "Сменить группу"
bot.hears('👥 Сменить группу', async (ctx) => {
  await ctx.scene.enter(GROUP_SELECTION_SCENE_ID);
});

// Обработка кнопки "Информация"
bot.hears('ℹ️ Информация', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const user = await userService.findByTelegramId(telegramId);

  let message = 'Бот для просмотра расписания занятий.\n\n';

  if (user && user.group) {
    message += `Ваша группа: ${user.group.name}\n`;
    if (user.group.faculty) {
      message += `Факультет: ${user.group.faculty}\n`;
    }
  } else {
    message +=
      'У вас не выбрана группа. Используйте команду /group для выбора группы.\n';
  }

  message += '\nДоступные команды:\n';
  message += '/start - Начать работу с ботом\n';
  message += '/group - Выбрать группу\n';
  message += '/admin - Войти в панель администратора\n';

  message += '\n\n© Разработка сайтов, приложений BivekiGroup (biveki.ru)';

  await ctx.reply(message);
});

// Обработка кнопок админки
bot.hears('👥 Управление группами', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const isAdmin = await authService.isAdmin(telegramId);

  if (isAdmin) {
    await ctx.scene.enter(GROUP_MANAGEMENT_SCENE_ID);
  } else {
    await ctx.reply('У вас нет прав администратора.');
  }
});

bot.hears('📚 Управление расписанием', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const isAdmin = await authService.isAdmin(telegramId);

  if (isAdmin) {
    await ctx.scene.enter(SCHEDULE_MANAGEMENT_SCENE_ID);
  } else {
    await ctx.reply('У вас нет прав администратора.');
  }
});

bot.hears('👤 Управление пользователями', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const isAdmin = await authService.isAdmin(telegramId);

  if (isAdmin) {
    await ctx.reply(
      'Функция управления пользователями находится в разработке. Скоро будет доступна!',
      adminMenuKeyboard()
    );
  } else {
    await ctx.reply('У вас нет прав администратора.');
  }
});

bot.hears('🔙 Выйти из админки', async (ctx) => {
  await ctx.reply('Вы вышли из панели администратора', mainMenuKeyboard());
});

// Обработка неизвестных сообщений
bot.on(message('text'), async (ctx) => {
  await ctx.reply(
    'Я не понимаю эту команду. Пожалуйста, используйте кнопки меню или команды /start, /group, /admin.'
  );
});

// Функция для запуска бота
export const startBot = async () => {
  try {
    await bot.launch();
    console.log('Бот успешно запущен');

    // Включаем graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('Ошибка при запуске бота:', error);
  }
};
