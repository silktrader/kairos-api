import { IsNotEmpty, IsISO8601 } from 'class-validator';

export class DateRangeDto {
  @IsNotEmpty()
  @IsISO8601()
  startDate: Date;

  @IsNotEmpty()
  @IsISO8601()
  endDate: Date;
}
