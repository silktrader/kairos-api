import { IsNotEmpty, IsISO8601 } from 'class-validator';

export class HabitEntryDto {
  @IsNotEmpty()
  habitId: number;

  @IsNotEmpty()
  @IsISO8601()
  date: string;

  comment: string;
}
