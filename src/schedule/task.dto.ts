import { IsNotEmpty } from 'class-validator';

export class TaskDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  order: number;

  details: string;
}
