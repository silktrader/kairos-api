import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TaskDto } from './task.dto';
import { User } from 'src/auth/user.entity';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { GetTasksDto } from './get-tasks.dto';
import { DeleteTaskDto } from './deleteTask.dto';
import { NewTasksPositionsDto } from './new-tasks-positions.dto';
import { Connection } from 'typeorm';
import { isSameDay, parseJSON, parseISO } from 'date-fns';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private connection: Connection,
  ) {}

  async addTask(user: User, taskDto: TaskDto): Promise<Task> {
    return await this.taskRepository.addTask(taskDto, user);
  }

  async updateTask(
    user: User,
    taskId: number,
    taskDto: TaskDto,
  ): Promise<Task> {
    // reference the task and check whether it exists
    const initialTask = await this.taskRepository.getTaskById(taskId, user);

    if (!initialTask) {
      throw new NotFoundException(`Couldn't find task #${taskId}`);
    }

    // reset duration data when the task is incomplete
    taskDto.duration = taskDto.complete ? taskDto.duration : null;

    // check whether the date was changed
    const a = parseISO(initialTask.date.toString());
    const b = typeof initialTask.date;
    if (
      !isSameDay(parseISO(initialTask.date.toString()), parseJSON(taskDto.date))
    ) {
      // append the task to the bottom of the date's task list
      const dateTasks = await this.taskRepository.getTasks(user, {
        startDate: taskDto.date,
        endDate: taskDto.date,
      });
      if (dateTasks) {
        // check which task is positioned at the bottom
        const checkingTasks = new Set<Task>(dateTasks);
        let lastTaskId = null;

        while (checkingTasks.size > 0) {
          for (const task of checkingTasks) {
            if (task.previousId === lastTaskId) {
              // build the path to the last task
              lastTaskId = task.id;

              // speed up successive iterations; possible issue with changing collection while iterating
              checkingTasks.delete(task);
              break;
            }
          }
        }

        // assign the new reference ID
        taskDto.previousId = lastTaskId;
      }
    }

    return await this.taskRepository.updateTask(initialTask, taskDto);
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

  async getTasks(user: User, getTasksDto: GetTasksDto) {
    return await this.taskRepository.getTasks(user, getTasksDto);
  }
}
