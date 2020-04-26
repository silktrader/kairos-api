import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Task } from 'src/tasks/task.entity';
import { Tag } from './tag.entity';

@Entity()
export class TaskTag {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Tag,
    tag => tag.taskTags,
    { eager: true },
  )
  tag: Tag;

  @ManyToOne(
    () => Task,
    task => task.tags,
  )
  task: Task;
}
