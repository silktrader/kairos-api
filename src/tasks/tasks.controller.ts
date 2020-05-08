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
import { TasksService } from './tasks.service';
import { TaskDto } from './models/task.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/auth/user.entity';
import { DatesDto } from './models/dates.dto';
import { TaskUpdateDto } from './models/task-update.dto';
import { DeleteTaskDto } from './models/deleteTask.dto';
import { TaskTimer } from './task-timer.entity';
import { DeleteResult } from 'typeorm';

@Controller('tasks')
@UseGuards(AuthGuard())
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Post()
  async addTask(
    @GetUser() user: User,
    @Body() taskDto: TaskDto,
  ): Promise<TaskDto> {
    return await this.taskService.addTask(user, taskDto);
  }

  @Get()
  async getTasksInDates(
    @GetUser() user: User,
    @Query() dto: DatesDto,
  ): Promise<ReadonlyArray<TaskDto>> {
    return await this.taskService.getTasks(user, dto.dates);
  }

  @Put(':taskId')
  async updateTask(
    @GetUser() user: User,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() taskDto: TaskDto,
  ): Promise<TaskDto> {
    return await this.taskService.updateTask(user, taskId, taskDto);
  }

  @Put()
  async updateTasks(
    @GetUser() user: User,
    @Body() tasks: ReadonlyArray<TaskUpdateDto>,
  ): Promise<ReadonlyArray<TaskDto>> {
    return await this.taskService.updateTasks(user, tasks);
  }

  @Delete(':taskId')
  async deleteTask(
    @GetUser() user: User,
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<DeleteTaskDto> {
    return await this.taskService.deleteTask(user, taskId);
  }

  /* Timer endpoints */

  @Get('/timers')
  async getTimers(@GetUser() user: User): Promise<Array<TaskTimer>> {
    return await this.taskService.getTimers(user);
  }

  @Post(':taskId/timer')
  async addTimer(
    @GetUser() user: User,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() timer: { timestamp: number },
  ): Promise<TaskTimer> {
    return await this.taskService.addTimer(user, taskId, timer.timestamp);
  }

  @Delete(':taskId/timer')
  async deleteTimer(
    @GetUser() user: User,
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<DeleteResult> {
    return await this.taskService.deleteTimer(user, taskId);
  }
}
