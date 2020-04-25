import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Task } from 'src/tasks/task.entity';
import { Tag } from './tag.entity';

@Entity()
export class TaskTag {
  @PrimaryColumn()
  tagId: number;

  @PrimaryColumn()
  taskId: number;

  @ManyToOne(
    () => Tag,
    tag => tag.taskTags,
    { eager: true },
  )
  tag: Tag;

  @ManyToOne(
    () => Task,
    task => task.tags,
    { eager: true },
  )
  task: Task;
}
