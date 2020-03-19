import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/auth/user.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  title: string;

  @Column({ nullable: true })
  details?: string;

  @Column({ nullable: true })
  previousId?: number;

  @Column()
  userId: number;

  @ManyToOne(
    () => User,
    user => user.tasks,
  )
  user: User;
}
