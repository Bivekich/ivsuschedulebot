import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Schedule, WeekDay, WeekType } from '../entities/schedule.entity';
import { AppDataSource } from '../database/data-source';
import { addDays, startOfWeek, endOfWeek, format } from 'date-fns';

export class ScheduleService {
  private scheduleRepository: Repository<Schedule>;

  constructor() {
    this.scheduleRepository = AppDataSource.getRepository(Schedule);
  }

  async findAll(): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      relations: ['group'],
      order: { weekDay: 'ASC', startTime: 'ASC' },
    });
  }

  async findById(id: number): Promise<Schedule | null> {
    return this.scheduleRepository.findOne({
      where: { id },
      relations: ['group'],
    });
  }

  async findByGroupId(groupId: number): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      where: { groupId },
      relations: ['group'],
      order: { weekDay: 'ASC', startTime: 'ASC' },
    });
  }

  // Получить расписание для группы на конкретный день недели
  async findByGroupAndDay(
    groupId: number,
    weekDay: WeekDay,
    weekType?: WeekType
  ): Promise<Schedule[]> {
    let query = this.scheduleRepository
      .createQueryBuilder('Schedule')
      .leftJoinAndSelect('Schedule.group', 'group')
      .where('Schedule.groupId = :groupId', { groupId })
      .andWhere('Schedule.weekDay = :weekDay', { weekDay })
      .orderBy('Schedule.startTime', 'ASC');

    if (weekType) {
      query = query.andWhere(
        '(Schedule.weekType = :weekType OR Schedule.weekType = :bothType)',
        { weekType, bothType: WeekType.BOTH }
      );
    }

    return query.getMany();
  }

  // Получить расписание для группы на текущий день
  async findByGroupForToday(groupId: number): Promise<Schedule[]> {
    const today = new Date();
    const dayOfWeek = this.getDayOfWeek(today);

    // Определяем тип недели (первая или вторая)
    const weekNumber = this.getWeekNumber(today);
    const weekType = weekNumber % 2 === 1 ? WeekType.FIRST : WeekType.SECOND;

    return this.findByGroupAndDay(groupId, dayOfWeek, weekType);
  }

  // Получить расписание для группы на текущую неделю
  async findByGroupForCurrentWeek(
    groupId: number
  ): Promise<Record<WeekDay, Schedule[]>> {
    const today = new Date();
    const weekNumber = this.getWeekNumber(today);
    const weekType = weekNumber % 2 === 1 ? WeekType.FIRST : WeekType.SECOND;

    const result: Record<WeekDay, Schedule[]> = {} as Record<
      WeekDay,
      Schedule[]
    >;

    // Получаем расписание для каждого дня недели
    for (const day of Object.values(WeekDay)) {
      result[day] = await this.findByGroupAndDay(groupId, day, weekType);
    }

    return result;
  }

  async create(scheduleData: Partial<Schedule>): Promise<Schedule> {
    const schedule = this.scheduleRepository.create(scheduleData);
    return this.scheduleRepository.save(schedule);
  }

  async update(
    id: number,
    scheduleData: Partial<Schedule>
  ): Promise<Schedule | null> {
    await this.scheduleRepository.update(id, scheduleData);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.scheduleRepository.delete(id);
    return !!result.affected && result.affected > 0;
  }

  // Вспомогательные методы
  private getDayOfWeek(date: Date): WeekDay {
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
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}
