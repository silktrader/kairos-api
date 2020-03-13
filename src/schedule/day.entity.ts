import { Entity, Unique, PrimaryColumn, OneToMany, ManyToOne } from 'typeorm';
import { User } from '../auth/user.entity';
import { Task } from './task.entity';

@Entity()
@Unique(['date'])
export class Day {
  @PrimaryColumn({ type: 'date' })
  date: Date;

  @ManyToOne(
    () => User,
    user => user.days,
    { primary: true, eager: false },
  )
  user: User;

  @OneToMany(
    () => Task,
    task => task.day,
  )
  tasks: Array<Task>;
}
