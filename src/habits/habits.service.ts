import { Injectable, NotFoundException } from '@nestjs/common';
import { HabitsRepository } from './habits.repository';
import { HabitDto } from './habit.dto';
import { Habit } from './habit.entity';
import { User } from 'src/auth/user.entity';
import { DateRangeDto } from 'src/tasks/models/get-tasks.dto';
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

  async updateHabit(id: number, dto: HabitDto, user: User): Promise<Habit> {
    const habit = await this.habitsRepository.findOne(id);
    if (!habit) throw new NotFoundException();

    habit.title = dto.title;
    habit.description = dto.description;
    habit.colour = dto.colour;

    const updatedHabit = await this.habitsRepository.save(habit);
    delete updatedHabit.user;

    return updatedHabit;
  }

  async deleteHabit(id: number, user: User): Promise<DeleteResult> {
    // check if the habit exists
    const habit = await this.habitsRepository.findOne(id);
    if (!habit) throw new NotFoundException();

    // delete entries related to the deleted habit
    await this.habitsEntriesRepository.delete({ habitId: id });

    return await this.habitsRepository.delete(habit);
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
    date: string,
    habitId: number,
  ): Promise<DeleteResult> {
    const habitEntry = await this.habitsEntriesRepository.findOneOrFail({
      date,
      habitId,
    });
    return await this.habitsEntriesRepository.delete(habitEntry);
  }
}
