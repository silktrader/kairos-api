import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/auth/user.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  order: number;

  @Column()
  title: string;

  @Column()
  details: string;

  @ManyToOne(
    () => User,
    user => user.tasks,
  )
  user: User;
}
