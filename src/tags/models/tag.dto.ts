import { IsNotEmpty, IsLowercase, Length, IsAlpha } from 'class-validator';

export class TagDto {
  @IsNotEmpty()
  @IsLowercase()
  @Length(3, 12)
  @IsAlpha()
  name: string;

  description?: string;

  @IsNotEmpty()
  colour: string;
}
