import { IsNotEmpty, IsISO8601 } from 'class-validator';

export class DatesDto {
  @IsNotEmpty()
  // @IsISO8601({ each: true })
  dates: Array<string>;
}
