import { IsNotEmpty, IsISO8601 } from 'class-validator';

export class TaskDto {
  id?: number;

  @IsNotEmpty()
  @IsISO8601()
  date: string;

  @IsNotEmpty()
  title: string;

  details?: string;

  complete: boolean;

  duration?: number;

  previousId: number | null;

  tags: Array<string>;
}
