import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from 'src/auth/user.entity';
import { HabitEntry } from './habit-entry.entity';

@Entity()
export class Habit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  colour: string;

  @ManyToOne(
    () => User,
    user => user.habits,
  )
  user: User;

  @OneToMany(
    () => HabitEntry,
    habitEntry => habitEntry.habit,
  )
  entries: Array<HabitEntry>;
}
