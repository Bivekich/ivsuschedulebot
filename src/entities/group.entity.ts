import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Schedule } from './schedule.entity';
import { User } from './user.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  faculty: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Schedule, (schedule) => schedule.group)
  schedules: Schedule[];

  @OneToMany(() => User, (user) => user.group)
  users: User[];
}
