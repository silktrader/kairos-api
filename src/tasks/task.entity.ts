import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from 'src/auth/user.entity';
import { TaskTag } from 'src/tags/models/task-tag.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', nullable: true })
  date: string | null;

  @Column()
  title: string;

  @Column({ nullable: true })
  details?: string;

  @Column({ nullable: true })
  previousId: number;

  @Column()
  complete: boolean;

  @Column({ nullable: true })
  duration: number;

  @Column()
  userId: number;

  @ManyToOne(
    () => User,
    user => user.tasks,
  )
  user: User;

  @OneToMany(
    () => TaskTag,
    taskTag => taskTag.task,
    { eager: true },
  )
  tags: Array<TaskTag>;
}
