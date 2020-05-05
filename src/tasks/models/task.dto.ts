import { IsNotEmpty, IsISO8601, IsOptional, Length } from 'class-validator';

export class TaskDto {
  id?: number;

  @IsNotEmpty()
  @IsISO8601()
  date: string;

  @IsNotEmpty()
  @Length(5, 50)
  title: string;

  details?: string;

  complete: boolean;

  duration?: number;

  @IsNotEmpty()
  @IsOptional()
  previousId: number | null;

  tags: Array<string>;
}
