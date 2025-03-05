import { Scenes } from 'telegraf';
import { ScheduleService } from '../../services/schedule.service';
import { GroupService } from '../../services/group.service';
import {
  scheduleManagementKeyboard,
  groupSelectionKeyboard,
  weekDaysKeyboard,
  weekTypeKeyboard,
  cancelKeyboard,
  adminMenuKeyboard,
} from '../keyboards';
import { WeekDay, WeekType } from '../../entities/schedule.entity';
import {
  getWeekDayName,
  getWeekTypeName,
  formatTime,
} from '../../utils/date.utils';
import { formatLesson } from '../formatters';

export const SCHEDULE_MANAGEMENT_SCENE_ID = 'SCHEDULE_MANAGEMENT_SCENE';

export const createScheduleManagementScene = () => {
  const scheduleService = new ScheduleService();
  const groupService = new GroupService();

  const scene = new Scenes.BaseScene<Scenes.SceneContext>(
    SCHEDULE_MANAGEMENT_SCENE_ID
  );

  // Состояние для хранения данных о расписании
  interface ScheduleState {
    action: 'add' | 'edit' | 'delete' | 'view';
    step: string;
    groupId?: number;
    groupName?: string;
    scheduleId?: number;
    weekDay?: WeekDay;
    weekType?: WeekType;
    subjectName?: string;
    teacherName?: string;
    classroom?: string;
    startTime?: string;
    endTime?: string;
    schedules?: any[];
  }

  // Вход в сцену
  scene.enter(async (ctx) => {
    ctx.scene.session.state = {} as ScheduleState;
    await ctx.reply('Управление расписанием', scheduleManagementKeyboard());
  });

  // Обработка кнопки "Назад в админку"
  scene.hears('🔙 Назад в админку', async (ctx) => {
    await ctx.reply('Возвращаемся в меню администратора', adminMenuKeyboard());
    return ctx.scene.leave();
  });

  // Обработка кнопки "Отмена"
  scene.hears('🔙 Отмена', async (ctx) => {
    ctx.scene.session.state = {} as ScheduleState;
    await ctx.reply('Действие отменено', scheduleManagementKeyboard());
  });

  // Добавление занятия
  scene.hears('➕ Добавить занятие', async (ctx) => {
    const state = ctx.scene.session.state as ScheduleState;
    state.action = 'add';
    state.step = 'select_group';

    const groups = await groupService.findAll();
    if (groups.length === 0) {
      await ctx.reply('В базе данных нет групп. Сначала добавьте группу.');
      return ctx.reply('Управление расписанием', scheduleManagementKeyboard());
    }

    await ctx.reply('Выберите группу:', groupSelectionKeyboard(groups));
  });

  // Редактирование занятия
  scene.hears('✏️ Редактировать занятие', async (ctx) => {
    const state = ctx.scene.session.state as ScheduleState;
    state.action = 'edit';
    state.step = 'select_group';

    const groups = await groupService.findAll();
    if (groups.length === 0) {
      await ctx.reply('В базе данных нет групп.');
      return ctx.reply('Управление расписанием', scheduleManagementKeyboard());
    }

    await ctx.reply('Выберите группу:', groupSelectionKeyboard(groups));
  });

  // Удаление занятия
  scene.hears('❌ Удалить занятие', async (ctx) => {
    const state = ctx.scene.session.state as ScheduleState;
    state.action = 'delete';
    state.step = 'select_group';

    const groups = await groupService.findAll();
    if (groups.length === 0) {
      await ctx.reply('В базе данных нет групп.');
      return ctx.reply('Управление расписанием', scheduleManagementKeyboard());
    }

    await ctx.reply('Выберите группу:', groupSelectionKeyboard(groups));
  });

  // Просмотр расписания
  scene.hears('📋 Просмотр расписания', async (ctx) => {
    const state = ctx.scene.session.state as ScheduleState;
    state.action = 'view';
    state.step = 'select_group';

    const groups = await groupService.findAll();
    if (groups.length === 0) {
      await ctx.reply('В базе данных нет групп.');
      return ctx.reply('Управление расписанием', scheduleManagementKeyboard());
    }

    await ctx.reply('Выберите группу:', groupSelectionKeyboard(groups));
  });

  // Обработка всех текстовых сообщений
  scene.on('text', async (ctx) => {
    const state = ctx.scene.session.state as ScheduleState;
    const text = ctx.message.text;

    // Если нет действия, возвращаемся в меню
    if (!state.action) {
      return ctx.reply('Выберите действие:', scheduleManagementKeyboard());
    }

    // Обработка выбора группы
    if (state.step === 'select_group') {
      // Обработка кнопки "Назад"
      if (text === '🔙 Назад') {
        ctx.scene.session.state = {} as ScheduleState;
        await ctx.reply('Управление расписанием', scheduleManagementKeyboard());
        return;
      }

      const group = await groupService.findByName(text);
      if (!group) {
        return ctx.reply(
          'Группа не найдена. Пожалуйста, выберите группу из списка.'
        );
      }

      state.groupId = group.id;
      state.groupName = group.name;

      if (state.action === 'add') {
        state.step = 'select_day';
        await ctx.reply('Выберите день недели:', weekDaysKeyboard());
      } else if (
        state.action === 'edit' ||
        state.action === 'delete' ||
        state.action === 'view'
      ) {
        state.step = 'select_day';
        await ctx.reply('Выберите день недели:', weekDaysKeyboard());
      }
      return;
    }

    // Обработка выбора дня недели
    if (state.step === 'select_day') {
      const weekDayName = text;

      // Обработка кнопки "Назад"
      if (text === '🔙 Назад') {
        state.step = 'select_group';
        const groups = await groupService.findAll();
        await ctx.reply('Выберите группу:', groupSelectionKeyboard(groups));
        return;
      }

      const weekDayMap: Record<string, WeekDay> = {
        Понедельник: WeekDay.MONDAY,
        Вторник: WeekDay.TUESDAY,
        Среда: WeekDay.WEDNESDAY,
        Четверг: WeekDay.THURSDAY,
        Пятница: WeekDay.FRIDAY,
        Суббота: WeekDay.SATURDAY,
        Воскресенье: WeekDay.SUNDAY,
      };

      const weekDay = weekDayMap[weekDayName];
      if (!weekDay) {
        return ctx.reply(
          'Неверный день недели. Пожалуйста, выберите из списка.'
        );
      }

      state.weekDay = weekDay;

      if (state.action === 'add') {
        state.step = 'select_week_type';
        await ctx.reply('Выберите тип недели:', weekTypeKeyboard());
      } else if (
        state.action === 'edit' ||
        state.action === 'delete' ||
        state.action === 'view'
      ) {
        state.step = 'select_week_type';
        await ctx.reply('Выберите тип недели:', weekTypeKeyboard());
      }
      return;
    }

    // Обработка выбора типа недели
    if (state.step === 'select_week_type') {
      const weekTypeName = text;

      // Обработка кнопки "Назад"
      if (text === '🔙 Назад') {
        state.step = 'select_day';
        await ctx.reply('Выберите день недели:', weekDaysKeyboard());
        return;
      }

      const weekTypeMap: Record<string, WeekType> = {
        'Первая неделя': WeekType.FIRST,
        'Вторая неделя': WeekType.SECOND,
        'Обе недели': WeekType.BOTH,
      };

      const weekType = weekTypeMap[weekTypeName];
      if (!weekType) {
        return ctx.reply(
          'Неверный тип недели. Пожалуйста, выберите из списка.'
        );
      }

      state.weekType = weekType;

      if (state.action === 'add') {
        state.step = 'enter_subject';
        await ctx.reply('Введите название предмета:', cancelKeyboard());
      } else if (
        state.action === 'edit' ||
        state.action === 'delete' ||
        state.action === 'view'
      ) {
        // Получаем расписание для выбранного дня и типа недели
        const schedules = await scheduleService.findByGroupAndDay(
          state.groupId!,
          state.weekDay!,
          state.weekType
        );

        if (schedules.length === 0) {
          await ctx.reply(
            `Расписание для группы ${state.groupName} на ${getWeekDayName(
              state.weekDay!
            )} (${getWeekTypeName(state.weekType)}) не найдено.`
          );
          return ctx.reply(
            'Управление расписанием',
            scheduleManagementKeyboard()
          );
        }

        if (state.action === 'view') {
          // Просто показываем расписание
          let message = `Расписание для группы ${
            state.groupName
          } на ${getWeekDayName(state.weekDay!)} (${getWeekTypeName(
            state.weekType
          )}):\n\n`;

          schedules.forEach((schedule, index) => {
            message += `${index + 1}. ${formatLesson(schedule)}\n`;
          });

          await ctx.reply(message);
          return ctx.reply(
            'Управление расписанием',
            scheduleManagementKeyboard()
          );
        } else {
          // Для редактирования или удаления предлагаем выбрать занятие
          let message = 'Выберите занятие (введите номер):\n\n';

          schedules.forEach((schedule, index) => {
            message += `${index + 1}. ${schedule.subjectName} (${formatTime(
              schedule.startTime
            )} - ${formatTime(schedule.endTime)})\n`;
          });

          state.step = 'select_schedule';
          state.schedules = schedules;
          await ctx.reply(message, cancelKeyboard());
        }
      }
      return;
    }

    // Обработка выбора занятия для редактирования или удаления
    if (state.step === 'select_schedule') {
      const scheduleIndex = parseInt(text) - 1;

      if (
        isNaN(scheduleIndex) ||
        scheduleIndex < 0 ||
        scheduleIndex >= state.schedules!.length
      ) {
        return ctx.reply(
          'Неверный номер занятия. Пожалуйста, введите корректный номер.'
        );
      }

      const selectedSchedule = state.schedules![scheduleIndex];
      state.scheduleId = selectedSchedule.id;

      if (state.action === 'edit') {
        // Предзаполняем данные для редактирования
        state.subjectName = selectedSchedule.subjectName;
        state.teacherName = selectedSchedule.teacherName;
        state.classroom = selectedSchedule.classroom;
        state.startTime = selectedSchedule.startTime;
        state.endTime = selectedSchedule.endTime;

        state.step = 'enter_subject';
        await ctx.reply(
          `Текущее название предмета: ${state.subjectName}\nВведите новое название предмета (или введите "оставить" чтобы не менять):`,
          cancelKeyboard()
        );
      } else if (state.action === 'delete') {
        // Удаляем занятие
        try {
          if (state.scheduleId !== undefined) {
            await scheduleService.delete(state.scheduleId);
            await ctx.reply(
              `Занятие "${selectedSchedule.subjectName}" успешно удалено.`
            );
          } else {
            await ctx.reply('Ошибка: ID занятия не определен.');
          }
        } catch (error) {
          console.error('Ошибка при удалении занятия:', error);
          await ctx.reply('Произошла ошибка при удалении занятия.');
        }

        return ctx.reply(
          'Управление расписанием',
          scheduleManagementKeyboard()
        );
      }
      return;
    }

    // Обработка ввода названия предмета
    if (state.step === 'enter_subject') {
      if (state.action === 'edit' && text.toLowerCase() === 'оставить') {
        // Оставляем текущее значение
      } else {
        state.subjectName = text;
      }

      state.step = 'enter_teacher';
      await ctx.reply(
        `${
          state.action === 'edit'
            ? `Текущий преподаватель: ${state.teacherName || 'не указан'}\n`
            : ''
        }Введите имя преподавателя (или "нет" если не требуется):`,
        cancelKeyboard()
      );
      return;
    }

    // Обработка ввода имени преподавателя
    if (state.step === 'enter_teacher') {
      if (text.toLowerCase() === 'нет') {
        state.teacherName = undefined;
      } else if (state.action === 'edit' && text.toLowerCase() === 'оставить') {
        // Оставляем текущее значение
      } else {
        state.teacherName = text;
      }

      state.step = 'enter_classroom';
      await ctx.reply(
        `${
          state.action === 'edit'
            ? `Текущая аудитория: ${state.classroom || 'не указана'}\n`
            : ''
        }Введите номер аудитории (или "нет" если не требуется):`,
        cancelKeyboard()
      );
      return;
    }

    // Обработка ввода аудитории
    if (state.step === 'enter_classroom') {
      if (text.toLowerCase() === 'нет') {
        state.classroom = undefined;
      } else if (state.action === 'edit' && text.toLowerCase() === 'оставить') {
        // Оставляем текущее значение
      } else {
        state.classroom = text;
      }

      state.step = 'enter_start_time';
      await ctx.reply(
        `${
          state.action === 'edit'
            ? `Текущее время начала: ${formatTime(state.startTime!)}\n`
            : ''
        }Введите время начала занятия в формате ЧЧ:ММ (например, 09:00):`,
        cancelKeyboard()
      );
      return;
    }

    // Обработка ввода времени начала
    if (state.step === 'enter_start_time') {
      // Проверяем формат времени
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

      if (state.action === 'edit' && text.toLowerCase() === 'оставить') {
        // Оставляем текущее значение
      } else if (!timeRegex.test(text)) {
        return ctx.reply(
          'Неверный формат времени. Пожалуйста, введите время в формате ЧЧ:ММ (например, 09:00).'
        );
      } else {
        state.startTime = text;
      }

      state.step = 'enter_end_time';
      await ctx.reply(
        `${
          state.action === 'edit'
            ? `Текущее время окончания: ${formatTime(state.endTime!)}\n`
            : ''
        }Введите время окончания занятия в формате ЧЧ:ММ (например, 10:30):`,
        cancelKeyboard()
      );
      return;
    }

    // Обработка ввода времени окончания
    if (state.step === 'enter_end_time') {
      // Проверяем формат времени
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

      if (state.action === 'edit' && text.toLowerCase() === 'оставить') {
        // Оставляем текущее значение
      } else if (!timeRegex.test(text)) {
        return ctx.reply(
          'Неверный формат времени. Пожалуйста, введите время в формате ЧЧ:ММ (например, 10:30).'
        );
      } else {
        state.endTime = text;
      }

      // Сохраняем данные
      try {
        if (state.action === 'add') {
          await scheduleService.create({
            groupId: state.groupId,
            weekDay: state.weekDay,
            weekType: state.weekType,
            subjectName: state.subjectName,
            teacherName: state.teacherName,
            classroom: state.classroom,
            startTime: state.startTime,
            endTime: state.endTime,
          });

          await ctx.reply(
            `Занятие "${state.subjectName}" успешно добавлено в расписание.`
          );
        } else if (state.action === 'edit') {
          await scheduleService.update(state.scheduleId!, {
            subjectName: state.subjectName,
            teacherName: state.teacherName,
            classroom: state.classroom,
            startTime: state.startTime,
            endTime: state.endTime,
          });

          await ctx.reply(`Занятие успешно обновлено.`);
        }
      } catch (error) {
        console.error('Ошибка при сохранении расписания:', error);
        await ctx.reply('Произошла ошибка при сохранении расписания.');
      }

      return ctx.reply('Управление расписанием', scheduleManagementKeyboard());
    }
  });

  return scene;
};
