import { IsNotEmpty } from 'class-validator';

export class TagDto {
  @IsNotEmpty()
  name: string;

  description?: string;
}
