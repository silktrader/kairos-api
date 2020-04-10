import { Injectable } from '@nestjs/common';
import { HabitsRepository } from './habits.repository';
import { HabitDto } from './habit.dto';
import { Habit } from './habit.entity';
import { User } from 'src/auth/user.entity';

@Injectable()
export class HabitsService {
  constructor(private readonly habitsRepository: HabitsRepository) {}

  async addHabit(habitDto: HabitDto, user: User): Promise<Habit> {
    return await this.habitsRepository.addHabit(habitDto, user);
  }

  async getHabits(user: User): Promise<ReadonlyArray<Habit>> {
    return await this.habitsRepository.getHabits(user);
  }
}
