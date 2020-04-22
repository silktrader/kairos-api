import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import { Task } from 'src/tasks/task.entity';
import { Habit } from 'src/habits/habit.entity';

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
