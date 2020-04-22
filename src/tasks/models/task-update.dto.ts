import { TaskDto } from './task.dto';
import { IsNotEmpty, IsInt, IsPositive } from 'class-validator';

export class TaskUpdateDto extends TaskDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  id: number;
}
