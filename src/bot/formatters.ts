import { Schedule, WeekDay, WeekType } from '../entities/schedule.entity';
import {
  formatTime,
  getWeekDayName,
  getWeekTypeName,
} from '../utils/date.utils';

// Форматирование одного занятия
export const formatLesson = (lesson: Schedule): string => {
  const startTime = formatTime(lesson.startTime);
  const endTime = formatTime(lesson.endTime);

  let result = `🕒 *${startTime} - ${endTime}*\n`;
  result += `📚 *${lesson.subjectName}*\n`;

  if (lesson.teacherName) {
    result += `👨‍🏫 ${lesson.teacherName}\n`;
  }

  if (lesson.classroom) {
    result += `🏢 Аудитория: ${lesson.classroom}\n`;
  }

  if (lesson.weekType !== WeekType.BOTH) {
    result += `🔄 ${getWeekTypeName(lesson.weekType)}\n`;
  }

  return result;
};

// Форматирование расписания на день
export const formatDaySchedule = (
  lessons: Schedule[],
  weekDay: WeekDay
): string => {
  if (lessons.length === 0) {
    return `*${getWeekDayName(
      weekDay
    )}*\n\nЗанятий нет 🎉\n\n_© Разработка: BivekiGroup (biveki.ru)_`;
  }

  let result = `*${getWeekDayName(weekDay)}*\n\n`;

  lessons.forEach((lesson, index) => {
    result += formatLesson(lesson);

    if (index < lessons.length - 1) {
      result += '\n───────────────\n';
    }
  });

  result += '\n\n_© Разработка: BivekiGroup (biveki.ru)_';

  return result;
};

// Форматирование расписания на неделю
export const formatWeekSchedule = (
  scheduleByDay: Record<WeekDay, Schedule[]>,
  weekType: WeekType
): string => {
  let result = `*Расписание на ${getWeekTypeName(weekType).toLowerCase()}*\n\n`;

  // Порядок дней недели
  const orderedDays = [
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
    WeekDay.SATURDAY,
    WeekDay.SUNDAY,
  ];

  let hasLessons = false;

  for (const day of orderedDays) {
    const lessons = scheduleByDay[day];

    if (lessons && lessons.length > 0) {
      hasLessons = true;
      result += `*${getWeekDayName(day)}*\n`;

      lessons.forEach((lesson) => {
        const startTime = formatTime(lesson.startTime);
        const endTime = formatTime(lesson.endTime);

        result += `🕒 ${startTime}-${endTime} | ${lesson.subjectName}`;

        if (lesson.classroom) {
          result += ` | Ауд. ${lesson.classroom}`;
        }

        result += '\n';
      });

      result += '\n';
    }
  }

  if (!hasLessons) {
    result += 'На этой неделе занятий нет 🎉';
  }

  result += '\n\n_© Разработка: BivekiGroup (biveki.ru)_';

  return result;
};

// Форматирование группы
export const formatGroup = (group: {
  id: number;
  name: string;
  faculty?: string;
  description?: string;
}): string => {
  let result = `*Группа:* ${group.name}\n`;

  if (group.faculty) {
    result += `*Факультет:* ${group.faculty}\n`;
  }

  if (group.description) {
    result += `*Описание:* ${group.description}\n`;
  }

  return result;
};
