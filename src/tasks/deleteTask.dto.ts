import { TaskDto } from './task.dto';

export interface DeleteTaskDto {
  deletedTaskId: number;
  affectedTask: TaskDto;
}
