import { Controller, UseGuards, Post, Body, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/auth/user.entity';
import { HabitDto } from './habit.dto';
import { Habit } from './habit.entity';
import { HabitsService } from './habits.service';

@Controller('habits')
@UseGuards(AuthGuard())
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  async addHabit(
    @GetUser() user: User,
    @Body() habitDto: HabitDto,
  ): Promise<Habit> {
    return await this.habitsService.addHabit(habitDto, user);
  }

  @Get()
  async getHabits(@GetUser() user: User): Promise<ReadonlyArray<Habit>> {
    return await this.habitsService.getHabits(user);
  }
}
