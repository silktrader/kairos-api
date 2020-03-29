import { IsNotEmpty, IsDateString } from 'class-validator';

export class TaskDto {
  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @IsNotEmpty()
  title: string;

  details?: string;

  complete: boolean;

  duration?: number;

  previousId?: number;
}
