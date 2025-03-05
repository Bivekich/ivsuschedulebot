import { Scenes } from 'telegraf';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { adminMenuKeyboard, cancelKeyboard } from '../keyboards';

export const ADMIN_LOGIN_SCENE_ID = 'ADMIN_LOGIN_SCENE';

export const createAdminLoginScene = () => {
  const authService = new AuthService();
  const userService = new UserService();

  const scene = new Scenes.BaseScene<Scenes.SceneContext>(ADMIN_LOGIN_SCENE_ID);

  // Состояние для хранения введенных данных
  interface AdminLoginState {
    username?: string;
    step: 'username' | 'password';
  }

  // Вход в сцену
  scene.enter(async (ctx) => {
    // Проверяем, является ли пользователь уже администратором
    const telegramId = ctx.from?.id.toString();
    if (telegramId) {
      const isAdmin = await authService.isAdmin(telegramId);
      if (isAdmin) {
        await ctx.reply(
          'Вы уже авторизованы как администратор.',
          adminMenuKeyboard()
        );
        return ctx.scene.leave();
      }
    }

    // Инициализируем состояние
    ctx.scene.session.state = { step: 'username' } as AdminLoginState;

    await ctx.reply(
      'Введите имя пользователя администратора:',
      cancelKeyboard()
    );
  });

  // Обработка отмены
  scene.hears('🔙 Отмена', async (ctx) => {
    await ctx.reply('Вход в админку отменен.');
    return ctx.scene.leave();
  });

  // Обработка ввода
  scene.on('text', async (ctx) => {
    const state = ctx.scene.session.state as AdminLoginState;
    const text = ctx.message.text;

    if (state.step === 'username') {
      // Сохраняем имя пользователя и запрашиваем пароль
      state.username = text;
      state.step = 'password';
      return ctx.reply('Введите пароль администратора:');
    } else if (state.step === 'password' && state.username) {
      // Проверяем учетные данные
      const isValid = await authService.validateAdmin(state.username, text);

      if (isValid) {
        // Устанавливаем пользователя как администратора
        const telegramId = ctx.from.id.toString();
        await authService.setUserAsAdmin(telegramId);

        // Генерируем токен
        const token = authService.generateToken(telegramId);

        await ctx.reply('Вы успешно вошли в админку!', adminMenuKeyboard());
        return ctx.scene.leave();
      } else {
        await ctx.reply(
          'Неверное имя пользователя или пароль. Попробуйте еще раз.'
        );
        // Сбрасываем состояние
        ctx.scene.session.state = { step: 'username' } as AdminLoginState;
        return ctx.reply('Введите имя пользователя администратора:');
      }
    }
  });

  return scene;
};
