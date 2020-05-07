import { Task } from './task.entity';
import { EntityRepository, Repository, DeleteResult, In } from 'typeorm';
import { TaskDto } from './models/task.dto';
import { User } from 'src/auth/user.entity';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  async getTasksInDates(
    user: User,
    dates: Array<string>,
  ): Promise<ReadonlyArray<Task>> {
    return this.find({
      userId: user.id,
      date: In(dates),
    });
  }

  async getTaskById(id: number, user: User): Promise<Task> {
    return this.findOne(
      {
        id,
        userId: user.id,
      },
      { relations: ['tags'] },
    );
  }

  async getTaskByPreviousId(previousId: number, user: User): Promise<Task> {
    return this.findOne(
      { previousId, userId: user.id },
      { relations: ['tags'] },
    );
  }

  async addTask(taskDto: TaskDto, user: User): Promise<Task> {
    // read the latest task's position
    // tk user mapper
    const task = new Task();
    task.date = taskDto.date;
    task.title = taskDto.title;
    task.details = taskDto.details;
    task.previousId = taskDto.previousId;
    task.complete = taskDto.complete;
    task.duration = taskDto.duration;
    task.user = user;
    await this.save(task);

    // remove sensitive data from Task
    delete task.user;

    return task;
  }

  // tk temp, must merge repo with service
  async saveTask(task: Task): Promise<Task> {
    return await this.save(task);
  }

  async updateTask(task: Task, taskDto: TaskDto): Promise<Task> {
    // must implement mapper tk
    task.date = taskDto.date;
    task.title = taskDto.title;
    task.details = taskDto.details;
    task.complete = taskDto.complete;
    task.duration = taskDto.duration;
    task.previousId = taskDto.previousId;
    await this.save(task);

    // remove sensitive data (tk again map)
    delete task.user;

    return task;
  }

  async updateTaskPreviousId(task: Task, newPreviousId: number): Promise<void> {
    task.previousId = newPreviousId;
    this.save(task);
  }

  async deleteTask(task: Task): Promise<DeleteResult> {
    return this.delete(task);
  }

  /** Fetches all the tasks whose IDs are specified and which belong to the selected user. */
  async getUserTasksById(
    userId: number,
    tasksIds: Array<number>,
  ): Promise<ReadonlyArray<Task>> {
    return this.findByIds(tasksIds, {
      userId,
    });
  }
}
