import { Controller, Post, UseGuards, Param, Body, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScheduleService } from './schedule.service';
import { TaskDto } from './task.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/auth/user.entity';
import { Task } from './task.entity';
import { Day } from './day.entity';

export interface DateParams {
  year: number;
  month: number;
  day: number;
}

@Controller('schedule')
@UseGuards(AuthGuard())
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get(':year-:month-:day')
  async getDay(
    @Param() params: DateParams,
    @GetUser() user: User,
  ): Promise<Day> {
    const date = new Date(params.year, params.month - 1, params.day);
    return await this.scheduleService.getDay(user, date);
  }

  @Post(':year-:month-:day/tasks')
  async addTask(
    @Param() params: DateParams,
    @GetUser() user: User,
    @Body() taskDto: TaskDto,
  ): Promise<Task> {
    const { year, month, day } = params;

    return await this.scheduleService.addTask(
      user,
      new Date(year, month - 1, day),
      taskDto,
    );
  }
}
