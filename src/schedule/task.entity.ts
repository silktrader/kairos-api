import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Day } from './day.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order: number;

  @Column()
  title: string;

  @Column()
  details: string;

  @ManyToOne(
    () => Day,
    day => day.tasks,
  )
  day: Day;
}
