import { Repository, EntityRepository } from 'typeorm';
import { Day } from './day.entity';
import { User } from 'src/auth/user.entity';
import { NotFoundException } from '@nestjs/common';

@EntityRepository(Day)
export class DayRespository extends Repository<Day> {
  async addDay(date: Date, user: User): Promise<Day> {
    const day = new Day();
    day.date = date;
    day.user = user;
    await this.save(day);
    return day;
  }

  async getDay(date: Date, user: User): Promise<Day> {
    try {
      return await this.findOneOrFail({ date, user }, { relations: ['tasks'] });
    } catch {
      throw new NotFoundException();
    }
  }
}
