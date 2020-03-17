import { IsNotEmpty, IsDateString } from 'class-validator';

export class GetTasksDto {
  @IsNotEmpty()
  @IsDateString()
  startDate: Date;

  @IsNotEmpty()
  @IsDateString()
  endDate: Date;
}
