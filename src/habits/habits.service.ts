import { Injectable } from '@nestjs/common';
import { HabitsRepository } from './habits.repository';
import { HabitDto } from './habit.dto';
import { Habit } from './habit.entity';
import { User } from 'src/auth/user.entity';
import { DateRangeDto } from 'src/schedule/get-tasks.dto';
import { HabitEntry } from './habit-entry.entity';
import { Repository, Between, DeleteResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { HabitEntryDto } from './habit-entry.dto';

@Injectable()
export class HabitsService {
  constructor(
    private readonly habitsRepository: HabitsRepository,
    @InjectRepository(HabitEntry)
    private habitsEntriesRepository: Repository<HabitEntry>,
  ) {}

  async addHabit(habitDto: HabitDto, user: User): Promise<Habit> {
    return await this.habitsRepository.addHabit(habitDto, user);
  }

  async getHabits(user: User): Promise<ReadonlyArray<Habit>> {
    return await this.habitsRepository.getHabits(user);
  }

  async getHabitsEntries(
    user: User,
    dateRangeDto: DateRangeDto,
  ): Promise<ReadonlyArray<HabitEntryDto>> {
    return await this.habitsEntriesRepository.find({
      where: {
        userId: user.id,
        date: Between(dateRangeDto.startDate, dateRangeDto.endDate),
      },
    });
  }

  async setHabitEntry(
    user: User,
    habitEntryDto: HabitEntryDto,
  ): Promise<HabitEntryDto> {
    const habitEntry = new HabitEntry();
    // habitEntry.user = user;
    // tk ensure that the user owns the habit!
    habitEntry.date = habitEntryDto.date;
    habitEntry.comment = habitEntryDto.comment;
    habitEntry.habitId = habitEntryDto.habitId;
    return await this.habitsEntriesRepository.save(habitEntry);
  }

  async deleteHabitEntry(
    user: User,
    date: Date,
    habitId: number,
  ): Promise<DeleteResult> {
    const habitEntry = await this.habitsEntriesRepository.findOneOrFail({
      date,
      habitId,
    });
    return await this.habitsEntriesRepository.delete(habitEntry);
  }
}
