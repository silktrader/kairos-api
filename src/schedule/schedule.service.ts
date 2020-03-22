import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TaskDto } from './task.dto';
import { User } from 'src/auth/user.entity';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { GetTasksDto } from './get-tasks.dto';
import { DeleteTaskDto } from './deleteTask.dto';
import { throwError } from 'rxjs';
import { NewTasksPositionsDto } from './new-tasks-positions.dto';
import { Connection } from 'typeorm';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private connection: Connection,
  ) {}

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

  async repositionTasks(
    user: User,
    newTasksPositions: NewTasksPositionsDto,
  ): Promise<ReadonlyArray<Task>> {
    // fetch all the tasks to be repositioned and ensure they belong to the user
    const tasks = await this.taskRepository.getUserTasksById(
      user.id,
      newTasksPositions.tasks.map(task => task.taskId),
    );

    console.log(JSON.stringify(tasks));

    if (tasks.length != newTasksPositions.tasks.length) {
      throw new BadRequestException();
    }

    // map tasks by ID to ensure a match; arrays from getMany() might not follow order
    const mappedPositions = new Map<number, number>(
      newTasksPositions.tasks.map(item => [item.taskId, item.previousId]),
    );

    // overwrite new positions in a single transaction or fail
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const task of tasks) {
        task.previousId = mappedPositions.get(task.id);
        await queryRunner.manager.save(task);
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new ConflictException();
    } finally {
      // must release the instantiated queryRunner
      await queryRunner.release();
    }

    return tasks;
  }

  // async updateTaskPosition(
  //   user: User,
  //   taskId: number,
  //   previousId: number,
  // ): Promise<ReadonlyArray<TaskDto>> {
  //   // look for the involved task
  //   const movingTask = await this.taskRepository.getTaskById(taskId, user);

  //   if (!movingTask) {
  //     throw new NotFoundException();
  //   }

  //   const movingTaskPreviousId = movingTask.previousId;

  //   // change the task's previous ID to the new one
  //   await this.taskRepository.updateTaskPreviousId(movingTask, previousId);

  //   // prepare a list of affected tasks to update the client; wait for the updated repositioned task
  //   const affectedTasks: Array<TaskDto> = [movingTask];

  //   // change the task that referenced the moving task
  //   const orphanTask = await this.taskRepository.getTaskByPreviousId(
  //     taskId,
  //     user,
  //   );
  //   if (orphanTask) {
  //     await this.taskRepository.updateTaskPreviousId(
  //       orphanTask,
  //       movingTaskPreviousId,
  //     );
  //     affectedTasks.push(orphanTask);
  //   }

  //   // change the task that referenced the one on top of the moving task
  //   const affectedTask = await this.taskRepository.getTaskByPreviousId(
  //     previousId,
  //     user,
  //   );
  //   if (affectedTask) {
  //     await this.taskRepository.updateTaskPreviousId(affectedTask, taskId);
  //     affectedTasks.push(affectedTask);
  //   }

  //   return affectedTasks;
  // }

  async getTasks(user: User, getTasksDto: GetTasksDto) {
    return await this.taskRepository.getTasks(user, getTasksDto);
  }
}
