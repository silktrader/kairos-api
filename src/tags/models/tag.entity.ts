import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from 'src/auth/user.entity';
import { TaskTag } from './task-tag.entity';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  colour: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  userId: number;

  @ManyToOne(
    () => User,
    user => user.tags,
  )
  user: User;

  @OneToMany(
    () => TaskTag,
    taskTag => taskTag.tag,
  )
  taskTags: Array<TaskTag>;
}
