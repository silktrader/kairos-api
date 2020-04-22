import { IsNotEmpty, IsDateString } from 'class-validator';

export class DateRangeDto {
  @IsNotEmpty()
  @IsDateString()
  startDate: Date;

  @IsNotEmpty()
  @IsDateString()
  endDate: Date;
}
