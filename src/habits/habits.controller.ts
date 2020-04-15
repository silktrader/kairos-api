import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Query,
  Delete,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/auth/user.entity';
import { HabitDto } from './habit.dto';
import { Habit } from './habit.entity';
import { HabitsService } from './habits.service';
import { DateRangeDto } from 'src/schedule/get-tasks.dto';
import { HabitEntryDto } from './habit-entry.dto';
import { DeleteResult } from 'typeorm';
import { ParseDatePipe } from './parse-date.pipe';

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

  @Put(':id')
  async updateHabit(
    @GetUser() user: User,
    @Body() habitDto: HabitDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Habit> {
    return await this.habitsService.updateHabit(id, habitDto, user);
  }

  @Delete(':id')
  async deleteHabit(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteResult> {
    return await this.habitsService.deleteHabit(id, user);
  }

  @Get('entries')
  async getHabitsEntries(
    @GetUser() user: User,
    @Query() dateRangeDto: DateRangeDto,
  ): Promise<ReadonlyArray<HabitEntryDto>> {
    return await this.habitsService.getHabitsEntries(user, dateRangeDto);
  }

  @Post('entries')
  async setHabitEntry(
    @GetUser() user: User,
    @Body() habitEntryDto: HabitEntryDto,
  ): Promise<HabitEntryDto> {
    return await this.habitsService.setHabitEntry(user, habitEntryDto);
  }

  @Delete('entries/:date/:habitId')
  async deleteHabitEntry(
    @GetUser() user: User,
    @Param('date', ParseDatePipe) date: Date,
    @Param('habitId', ParseIntPipe) habitId: number,
  ): Promise<DeleteResult> {
    return await this.habitsService.deleteHabitEntry(user, date, habitId);
  }
}
