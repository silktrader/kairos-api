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
import { Task } from './task.entity';
import { DateRangeDto } from './models/get-tasks.dto';
import { TaskUpdateDto } from './models/task-update.dto';

@Controller('tasks')
@UseGuards(AuthGuard())
export class TasksController {
  constructor(private readonly scheduleService: TasksService) {}

  @Post()
  async addTask(
    @GetUser() user: User,
    @Body() taskDto: TaskDto,
  ): Promise<Task> {
    return await this.scheduleService.addTask(user, taskDto);
  }

  @Get()
  async getTasks(@GetUser() user: User, @Query() dateRangeDto: DateRangeDto) {
    return await this.scheduleService.getTasks(user, dateRangeDto);
  }

  @Put(':taskId')
  async updateTask(
    @GetUser() user: User,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() taskDto: TaskDto,
  ) {
    return await this.scheduleService.updateTask(user, taskId, taskDto);
  }

  @Put()
  async updateTasks(
    @GetUser() user: User,
    @Body() tasks: ReadonlyArray<TaskUpdateDto>,
  ) {
    return await this.scheduleService.updateTasks(user, tasks);
  }

  @Delete(':taskId')
  async deleteTask(
    @GetUser() user: User,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return await this.scheduleService.deleteTask(user, taskId);
  }
}
