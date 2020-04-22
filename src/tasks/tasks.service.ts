import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TaskDto } from './models/task.dto';
import { User } from 'src/auth/user.entity';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { DateRangeDto } from './models/get-tasks.dto';
import { DeleteTaskDto } from './models/deleteTask.dto';
import { Connection } from 'typeorm';
import { isSameDay, parseJSON, parseISO } from 'date-fns';
import { TaskUpdateDto } from './models/task-update.dto';

@Injectable()
export class TasksService {
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

  async updateTasks(
    user: User,
    tasksDtos: ReadonlyArray<TaskUpdateDto>,
  ): Promise<ReadonlyArray<Task>> {
    const tasks = await this.taskRepository.getUserTasksById(
      user.id,
      tasksDtos.map(dto => dto.id),
    );

    if (tasks.length !== tasksDtos.length) {
      throw new NotFoundException();
    }

    // map tasks by ID to ensure a match; arrays from getMany() might not follow order
    const dtosMap = new Map<number, TaskUpdateDto>(
      tasksDtos.map(dto => [dto.id, dto]),
    );

    // overwrite tasks in a single transaction or fail
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const task of tasks) {
        const dto = dtosMap.get(task.id);
        task.title = dto.title;
        task.details = dto.details;
        task.date = dto.date;
        task.previousId = dto.previousId;
        task.complete = dto.complete;
        task.duration = dto.duration;
        await queryRunner.manager.save(task);
      }
      await queryRunner.commitTransaction();
    } catch {
      // apply all transactions or none at all
      await queryRunner.rollbackTransaction();
      throw new ConflictException();
    } finally {
      // must release the instantiated queryRunner
      await queryRunner.release();
    }

    return tasks;
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

  async getTasks(user: User, dateRangeDto: DateRangeDto) {
    return await this.taskRepository.getTasks(user, dateRangeDto);
  }
}
