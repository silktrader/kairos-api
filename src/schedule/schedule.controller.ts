import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Query,
  Delete,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScheduleService } from './schedule.service';
import { TaskDto } from './task.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/auth/user.entity';
import { Task } from './task.entity';
import { GetTasksDto } from './get-tasks.dto';
import { TaskUpdateDto } from './task-update.dto';

@Controller('schedule')
@UseGuards(AuthGuard())
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

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

  @Put('tasks/:taskId')
  async updateTask(
    @GetUser() user: User,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() taskDto: TaskDto,
  ) {
    return await this.scheduleService.updateTask(user, taskId, taskDto);
  }

  @Put('tasks')
  async updateTasks(
    @GetUser() user: User,
    @Body() tasks: ReadonlyArray<TaskUpdateDto>,
  ) {
    return await this.scheduleService.updateTasks(user, tasks);
  }

  @Delete('tasks/:taskId')
  async deleteTask(
    @GetUser() user: User,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return await this.scheduleService.deleteTask(user, taskId);
  }
}
