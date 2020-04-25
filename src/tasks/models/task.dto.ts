import { IsNotEmpty, IsDateString } from 'class-validator';

export class TaskDto {
  id?: number;

  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @IsNotEmpty()
  title: string;

  details?: string;

  complete: boolean;

  duration?: number;

  previousId: number | null;

  tags: Array<string>;
}
