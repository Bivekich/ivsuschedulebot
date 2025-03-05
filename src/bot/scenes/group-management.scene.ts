import { Scenes } from 'telegraf';
import { GroupService } from '../../services/group.service';
import {
  groupManagementKeyboard,
  cancelKeyboard,
  adminMenuKeyboard,
  confirmationKeyboard,
} from '../keyboards';
import { formatGroup } from '../formatters';

export const GROUP_MANAGEMENT_SCENE_ID = 'GROUP_MANAGEMENT_SCENE';

export const createGroupManagementScene = () => {
  const groupService = new GroupService();

  const scene = new Scenes.BaseScene<Scenes.SceneContext>(
    GROUP_MANAGEMENT_SCENE_ID
  );

  // Состояние для хранения данных о группе
  interface GroupState {
    action: 'add' | 'edit' | 'delete' | 'list';
    step: string;
    groupId?: number;
    name?: string;
    faculty?: string;
    description?: string;
    groups?: any[];
  }

  // Вход в сцену
  scene.enter(async (ctx) => {
    ctx.scene.session.state = {} as GroupState;
    await ctx.reply('Управление группами', groupManagementKeyboard());
  });

  // Обработка кнопки "Назад в админку"
  scene.hears('🔙 Назад в админку', async (ctx) => {
    await ctx.reply('Возвращаемся в меню администратора', adminMenuKeyboard());
    return ctx.scene.leave();
  });

  // Обработка кнопки "Отмена"
  scene.hears('🔙 Отмена', async (ctx) => {
    ctx.scene.session.state = {} as GroupState;
    await ctx.reply('Действие отменено', groupManagementKeyboard());
  });

  // Добавление группы
  scene.hears('➕ Добавить группу', async (ctx) => {
    const state = ctx.scene.session.state as GroupState;
    state.action = 'add';
    state.step = 'enter_name';

    await ctx.reply('Введите название группы:', cancelKeyboard());
  });

  // Редактирование группы
  scene.hears('✏️ Редактировать группу', async (ctx) => {
    const state = ctx.scene.session.state as GroupState;
    state.action = 'edit';
    state.step = 'select_group';

    const groups = await groupService.findAll();
    if (groups.length === 0) {
      await ctx.reply('В базе данных нет групп.');
      return ctx.reply('Управление группами', groupManagementKeyboard());
    }

    let message = 'Выберите группу для редактирования (введите номер):\n\n';
    groups.forEach((group, index) => {
      message += `${index + 1}. ${group.name}\n`;
    });

    state.groups = groups;
    await ctx.reply(message, cancelKeyboard());
  });

  // Удаление группы
  scene.hears('❌ Удалить группу', async (ctx) => {
    const state = ctx.scene.session.state as GroupState;
    state.action = 'delete';
    state.step = 'select_group';

    const groups = await groupService.findAll();
    if (groups.length === 0) {
      await ctx.reply('В базе данных нет групп.');
      return ctx.reply('Управление группами', groupManagementKeyboard());
    }

    let message = 'Выберите группу для удаления (введите номер):\n\n';
    groups.forEach((group, index) => {
      message += `${index + 1}. ${group.name}\n`;
    });

    state.groups = groups;
    await ctx.reply(message, cancelKeyboard());
  });

  // Список групп
  scene.hears('📋 Список групп', async (ctx) => {
    const groups = await groupService.findAll();

    if (groups.length === 0) {
      await ctx.reply('В базе данных нет групп.');
    } else {
      let message = 'Список групп:\n\n';
      groups.forEach((group, index) => {
        message += `${index + 1}. ${formatGroup(group)}\n`;
      });

      await ctx.reply(message);
    }

    await ctx.reply('Управление группами', groupManagementKeyboard());
  });

  // Обработка всех текстовых сообщений
  scene.on('text', async (ctx) => {
    const state = ctx.scene.session.state as GroupState;
    const text = ctx.message.text;

    // Если нет действия, возвращаемся в меню
    if (!state.action) {
      return ctx.reply('Выберите действие:', groupManagementKeyboard());
    }

    // Обработка выбора группы для редактирования или удаления
    if (state.step === 'select_group') {
      const groupIndex = parseInt(text) - 1;

      if (
        isNaN(groupIndex) ||
        groupIndex < 0 ||
        groupIndex >= state.groups!.length
      ) {
        return ctx.reply(
          'Неверный номер группы. Пожалуйста, введите корректный номер.'
        );
      }

      const selectedGroup = state.groups![groupIndex];
      state.groupId = selectedGroup.id;

      if (state.action === 'edit') {
        // Предзаполняем данные для редактирования
        state.name = selectedGroup.name;
        state.faculty = selectedGroup.faculty;
        state.description = selectedGroup.description;

        state.step = 'enter_name';
        await ctx.reply(
          `Текущее название группы: ${state.name}\nВведите новое название группы (или введите "оставить" чтобы не менять):`,
          cancelKeyboard()
        );
      } else if (state.action === 'delete') {
        // Запрашиваем подтверждение удаления
        await ctx.reply(
          `Вы уверены, что хотите удалить группу "${selectedGroup.name}"?`,
          confirmationKeyboard()
        );
        state.step = 'confirm_delete';
      }
      return;
    }

    // Обработка подтверждения удаления
    if (state.step === 'confirm_delete') {
      if (text.toLowerCase() === 'да' || text === '✅ Да') {
        try {
          await groupService.delete(state.groupId!);
          await ctx.reply('Группа успешно удалена.');
        } catch (error) {
          console.error('Ошибка при удалении группы:', error);
          await ctx.reply(
            'Произошла ошибка при удалении группы. Возможно, к ней привязаны пользователи или расписание.'
          );
        }

        return ctx.reply('Управление группами', groupManagementKeyboard());
      } else if (text.toLowerCase() === 'нет' || text === '❌ Нет') {
        await ctx.reply('Удаление отменено.');
        return ctx.reply('Управление группами', groupManagementKeyboard());
      } else {
        return ctx.reply('Пожалуйста, выберите "Да" или "Нет".');
      }
    }

    // Обработка ввода названия группы
    if (state.step === 'enter_name') {
      if (state.action === 'edit' && text.toLowerCase() === 'оставить') {
        // Оставляем текущее значение
      } else {
        state.name = text;

        // Проверяем уникальность названия группы
        if (state.action === 'add') {
          const existingGroup = await groupService.findByName(state.name);
          if (existingGroup) {
            return ctx.reply(
              'Группа с таким названием уже существует. Пожалуйста, введите другое название.'
            );
          }
        }
      }

      state.step = 'enter_faculty';
      await ctx.reply(
        `${
          state.action === 'edit'
            ? `Текущий факультет: ${state.faculty || 'не указан'}\n`
            : ''
        }Введите название факультета (или "нет" если не требуется):`,
        cancelKeyboard()
      );
      return;
    }

    // Обработка ввода факультета
    if (state.step === 'enter_faculty') {
      if (text.toLowerCase() === 'нет') {
        state.faculty = undefined;
      } else if (state.action === 'edit' && text.toLowerCase() === 'оставить') {
        // Оставляем текущее значение
      } else {
        state.faculty = text;
      }

      state.step = 'enter_description';
      await ctx.reply(
        `${
          state.action === 'edit'
            ? `Текущее описание: ${state.description || 'не указано'}\n`
            : ''
        }Введите описание группы (или "нет" если не требуется):`,
        cancelKeyboard()
      );
      return;
    }

    // Обработка ввода описания
    if (state.step === 'enter_description') {
      if (text.toLowerCase() === 'нет') {
        state.description = undefined;
      } else if (state.action === 'edit' && text.toLowerCase() === 'оставить') {
        // Оставляем текущее значение
      } else {
        state.description = text;
      }

      // Сохраняем данные
      try {
        if (state.action === 'add') {
          await groupService.create({
            name: state.name,
            faculty: state.faculty,
            description: state.description,
          });

          await ctx.reply(`Группа "${state.name}" успешно добавлена.`);
        } else if (state.action === 'edit') {
          await groupService.update(state.groupId!, {
            name: state.name,
            faculty: state.faculty,
            description: state.description,
          });

          await ctx.reply(`Группа успешно обновлена.`);
        }
      } catch (error) {
        console.error('Ошибка при сохранении группы:', error);
        await ctx.reply('Произошла ошибка при сохранении группы.');
      }

      return ctx.reply('Управление группами', groupManagementKeyboard());
    }
  });

  // Обработка inline кнопок
  scene.action(/confirm|cancel/, async (ctx) => {
    const state = ctx.scene.session.state as GroupState;

    // Используем any для обхода проблемы с типизацией
    const callbackData = (ctx.callbackQuery as any).data;

    if (callbackData === 'confirm' && state.step === 'confirm_delete') {
      try {
        await groupService.delete(state.groupId!);
        await ctx.editMessageText('Группа успешно удалена.');
      } catch (error) {
        console.error('Ошибка при удалении группы:', error);
        await ctx.editMessageText(
          'Произошла ошибка при удалении группы. Возможно, к ней привязаны пользователи или расписание.'
        );
      }
    } else {
      await ctx.editMessageText('Действие отменено.');
    }

    await ctx.reply('Управление группами', groupManagementKeyboard());
  });

  return scene;
};
