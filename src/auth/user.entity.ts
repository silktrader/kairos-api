import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import { Task } from 'src/schedule/task.entity';
import { Habit } from 'src/habits/habit.entity';
import { HabitEntry } from 'src/habits/habit-entry.entity';

@Entity()
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  hash: string;

  @OneToMany(
    () => Task,
    task => task.user,
  )
  tasks: Array<Task>;

  @OneToMany(
    () => Habit,
    habit => habit.user,
  )
  habits: Array<Habit>;
}
