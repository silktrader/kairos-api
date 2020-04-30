import { TaskDto } from './task.dto';

export interface DeleteTaskDto {
  affectedTask: TaskDto | null;
}
