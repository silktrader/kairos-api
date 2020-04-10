import { IsNotEmpty } from 'class-validator';

export class HabitDto {
  @IsNotEmpty()
  title: string;

  description: string;

  @IsNotEmpty()
  colour: string;
}
