import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskDto } from './task.dto';
import { User } from 'src/auth/user.entity';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { GetTasksDto } from './get-tasks.dto';
import { DeleteTaskDto } from './deleteTask.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async addTask(user: User, taskDto: TaskDto): Promise<Task> {
    return await this.taskRepository.addTask(taskDto, user);
  }

  async deleteTask(user: User, taskId: number): Promise<DeleteTaskDto> {
    // get the task, making sure the user owns it
    const deletedTask = await this.taskRepository.getTaskById(taskId, user);

    if (!deletedTask) {
      throw new NotFoundException();
    }

    // check whether there's a task which references the deleted one
    const affectedTask = await this.taskRepository.getTaskByPreviousId(
      deletedTask.id,
      user,
    );

    // shorten the linked list
    if (affectedTask) {
      await this.taskRepository.updateTaskPreviousId(
        affectedTask,
        deletedTask.previousId,
      );
      // remove sensitive date from orphan task, later apply mapper tk
      delete affectedTask.user;
    }

    const deletionResult = await this.taskRepository.deleteTask(deletedTask);

    if (deletionResult.affected === 0) {
      throw new NotFoundException();
    }

    return {
      deletedTaskId: deletedTask.id,
      affectedTask,
    };
  }

  async getTasks(user: User, getTasksDto: GetTasksDto) {
    return await this.taskRepository.getTasks(user, getTasksDto);
  }
}
