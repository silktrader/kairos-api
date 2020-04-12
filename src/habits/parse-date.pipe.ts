import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { parseISO } from 'date-fns';

@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  transform(value: string, metadata: ArgumentMetadata): Date {
    return parseISO(value);
  }
}
