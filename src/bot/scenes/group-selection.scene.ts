import { Scenes, Markup } from 'telegraf';
import { GroupService } from '../../services/group.service';
import { UserService } from '../../services/user.service';
import { groupSelectionKeyboard, mainMenuKeyboard } from '../keyboards';

export const GROUP_SELECTION_SCENE_ID = 'GROUP_SELECTION_SCENE';

export const createGroupSelectionScene = () => {
  const groupService = new GroupService();
  const userService = new UserService();

  const scene = new Scenes.BaseScene<Scenes.SceneContext>(
    GROUP_SELECTION_SCENE_ID
  );

  // Вход в сцену
  scene.enter(async (ctx) => {
    try {
      const groups = await groupService.findAll();

      if (groups.length === 0) {
        await ctx.reply(
          'В базе данных пока нет групп. Пожалуйста, обратитесь к администратору.'
        );
        return ctx.scene.leave();
      }

      await ctx.reply('Выберите вашу группу:', groupSelectionKeyboard(groups));
    } catch (error) {
      console.error('Ошибка при загрузке групп:', error);
      await ctx.reply(
        'Произошла ошибка при загрузке списка групп. Пожалуйста, попробуйте позже.'
      );
      return ctx.scene.leave();
    }
  });

  // Обработка выбора группы
  scene.on('text', async (ctx) => {
    try {
      const groupName = ctx.message.text;
      const group = await groupService.findByName(groupName);

      if (!group) {
        return ctx.reply(
          'Группа не найдена. Пожалуйста, выберите группу из списка.'
        );
      }

      // Получаем или создаем пользователя
      const telegramId = ctx.from.id.toString();
      let user = await userService.findByTelegramId(telegramId);

      if (user) {
        // Обновляем группу пользователя
        await userService.updateByTelegramId(telegramId, {
          groupId: group.id,
          group,
        });
      } else {
        // Создаем нового пользователя
        await userService.create({
          telegramId,
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
          groupId: group.id,
          group,
        });
      }

      await ctx.reply(`Вы выбрали группу: ${group.name}`, mainMenuKeyboard());
      return ctx.scene.leave();
    } catch (error) {
      console.error('Ошибка при выборе группы:', error);
      await ctx.reply(
        'Произошла ошибка при выборе группы. Пожалуйста, попробуйте позже.'
      );
      return ctx.scene.leave();
    }
  });

  return scene;
};
