import { Markup } from 'telegraf';
import { Group } from '../entities/group.entity';
import { WeekDay, WeekType } from '../entities/schedule.entity';
import { getWeekDayName, getWeekTypeName } from '../utils/date.utils';

// Главное меню для пользователя
export const mainMenuKeyboard = () => {
  return Markup.keyboard([
    ['📅 Расписание на сегодня'],
    ['📆 Расписание на завтра'],
    ['📚 Расписание на неделю'],
    ['👥 Сменить группу'],
    ['ℹ️ Информация'],
  ]).resize();
};

// Клавиатура для выбора группы
export const groupSelectionKeyboard = (groups: Group[]) => {
  const buttons = groups.map((group) => [group.name]);
  return Markup.keyboard(buttons).resize();
};

// Клавиатура для выбора дня недели
export const weekDaysKeyboard = () => {
  const buttons = Object.values(WeekDay).map((day) => [getWeekDayName(day)]);
  return Markup.keyboard([...buttons, ['🔙 Назад']]).resize();
};

// Клавиатура для выбора типа недели
export const weekTypeKeyboard = () => {
  return Markup.keyboard([
    [getWeekTypeName(WeekType.FIRST)],
    [getWeekTypeName(WeekType.SECOND)],
    [getWeekTypeName(WeekType.BOTH)],
    ['🔙 Назад'],
  ]).resize();
};

// Клавиатура для админа
export const adminMenuKeyboard = () => {
  return Markup.keyboard([
    ['👥 Управление группами'],
    ['📚 Управление расписанием'],
    ['👤 Управление пользователями'],
    ['🔙 Выйти из админки'],
  ]).resize();
};

// Клавиатура для управления группами
export const groupManagementKeyboard = () => {
  return Markup.keyboard([
    ['➕ Добавить группу'],
    ['✏️ Редактировать группу'],
    ['❌ Удалить группу'],
    ['📋 Список групп'],
    ['🔙 Назад в админку'],
  ]).resize();
};

// Клавиатура для управления расписанием
export const scheduleManagementKeyboard = () => {
  return Markup.keyboard([
    ['➕ Добавить занятие'],
    ['✏️ Редактировать занятие'],
    ['❌ Удалить занятие'],
    ['📋 Просмотр расписания'],
    ['🔙 Назад в админку'],
  ]).resize();
};

// Клавиатура для подтверждения действия
export const confirmationKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Да', 'confirm'),
      Markup.button.callback('❌ Нет', 'cancel'),
    ],
  ]);
};

// Клавиатура для отмены действия
export const cancelKeyboard = () => {
  return Markup.keyboard([['🔙 Отмена']]).resize();
};

// Клавиатура для пагинации
export const paginationKeyboard = (
  currentPage: number,
  totalPages: number,
  actionPrefix: string
) => {
  const buttons = [];

  if (currentPage > 1) {
    buttons.push(
      Markup.button.callback('⬅️', `${actionPrefix}_prev_${currentPage}`)
    );
  }

  buttons.push(Markup.button.callback(`${currentPage}/${totalPages}`, 'noop'));

  if (currentPage < totalPages) {
    buttons.push(
      Markup.button.callback('➡️', `${actionPrefix}_next_${currentPage}`)
    );
  }

  return Markup.inlineKeyboard([buttons]);
};
