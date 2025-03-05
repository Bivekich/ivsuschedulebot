import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { WeekDay, WeekType } from '../entities/schedule.entity';

// Форматирование даты в удобный для пользователя формат
export const formatDate = (date: Date): string => {
  if (isToday(date)) {
    return 'Сегодня';
  } else if (isTomorrow(date)) {
    return 'Завтра';
  } else {
    return format(date, 'd MMMM (EEEE)', { locale: ru });
  }
};

// Форматирование времени
export const formatTime = (time: string): string => {
  return time.substring(0, 5); // Формат HH:MM
};

// Получение дня недели из даты
export const getDayOfWeek = (date: Date): WeekDay => {
  const days = [
    WeekDay.SUNDAY,
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
    WeekDay.SATURDAY,
  ];
  return days[date.getDay()];
};

// Получение номера недели из даты
export const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Получение типа недели (первая или вторая)
export const getWeekType = (date: Date): WeekType => {
  const weekNumber = getWeekNumber(date);
  return weekNumber % 2 === 1 ? WeekType.FIRST : WeekType.SECOND;
};

// Получение названия дня недели на русском
export const getWeekDayName = (weekDay: WeekDay): string => {
  const weekDayNames: Record<WeekDay, string> = {
    [WeekDay.MONDAY]: 'Понедельник',
    [WeekDay.TUESDAY]: 'Вторник',
    [WeekDay.WEDNESDAY]: 'Среда',
    [WeekDay.THURSDAY]: 'Четверг',
    [WeekDay.FRIDAY]: 'Пятница',
    [WeekDay.SATURDAY]: 'Суббота',
    [WeekDay.SUNDAY]: 'Воскресенье',
  };
  return weekDayNames[weekDay];
};

// Получение названия типа недели на русском
export const getWeekTypeName = (weekType: WeekType): string => {
  const weekTypeNames: Record<WeekType, string> = {
    [WeekType.FIRST]: 'Первая неделя',
    [WeekType.SECOND]: 'Вторая неделя',
    [WeekType.BOTH]: 'Обе недели',
  };
  return weekTypeNames[weekType];
};
