import { Injectable } from '@nestjs/common';
import { TaskDto } from './task.dto';
import { User } from 'src/auth/user.entity';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { GetTasksDto } from './get-tasks.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async addTask(user: User, taskDto: TaskDto): Promise<Task> {
    return await this.taskRepository.addTask(taskDto, user);
  }

  async getTasks(user: User, getTasksDto: GetTasksDto) {
    return await this.taskRepository.getTasks(user, getTasksDto);
  }
}
