import {
  Controller,
  Post,
  UseGuards,
  Param,
  Body,
  Get,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScheduleService } from './schedule.service';
import { TaskDto } from './task.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/auth/user.entity';
import { Task } from './task.entity';
import { GetTasksDto } from './get-tasks.dto';

export interface DateParams {
  year: number;
  month: number;
  day: number;
}

@Controller('schedule')
@UseGuards(AuthGuard())
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // @Get(':year-:month-:day')
  // async getDay(
  //   @Param() params: DateParams,
  //   @GetUser() user: User,
  // ): Promise<Day> {
  //   const date = new Date(params.year, params.month - 1, params.day);
  //   return await this.scheduleService.getDay(user, date);
  // }

  @Post('tasks')
  async addTask(
    @GetUser() user: User,
    @Body() taskDto: TaskDto,
  ): Promise<Task> {
    return await this.scheduleService.addTask(user, taskDto);
  }

  @Get('tasks')
  async getTasks(@GetUser() user: User, @Query() getTasksDto: GetTasksDto) {
    return await this.scheduleService.getTasks(user, getTasksDto);
  }
}
