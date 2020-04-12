import { IsNotEmpty, IsDateString } from 'class-validator';

export class HabitEntryDto {
  @IsNotEmpty()
  habitId: number;

  @IsNotEmpty()
  @IsDateString()
  date: Date;

  comment: string;
}
