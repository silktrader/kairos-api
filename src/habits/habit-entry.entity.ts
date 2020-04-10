import { Entity, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { Habit } from './habit.entity';

@Entity()
export class HabitEntry {
  @PrimaryColumn()
  habitId: number;

  @PrimaryColumn({ type: 'date' })
  date: Date;

  @Column()
  comment: string;

  @ManyToOne(
    () => Habit,
    habit => habit.entries,
  )
  habit: Habit;
}
