import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Group } from './group.entity';

// Перечисление для дней недели
export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

// Перечисление для типа недели
export enum WeekType {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  BOTH = 'BOTH',
}

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: WeekDay,
  })
  weekDay: WeekDay;

  @Column({
    type: 'enum',
    enum: WeekType,
    default: WeekType.BOTH,
  })
  weekType: WeekType;

  @Column()
  subjectName: string;

  @Column({ nullable: true })
  teacherName: string;

  @Column({ nullable: true })
  classroom: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @ManyToOne(() => Group, (group) => group.schedules)
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column()
  groupId: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
