import { Task } from './task.entity';
import { EntityRepository, Repository, Between, DeleteResult } from 'typeorm';
import { TaskDto } from './task.dto';
import { User } from 'src/auth/user.entity';
import { GetTasksDto } from './get-tasks.dto';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  async getTaskById(id: number, user: User): Promise<Task> {
    return this.findOne({
      id,
      userId: user.id,
    });
  }

  async getTaskByPreviousId(previousId: number, user: User): Promise<Task> {
    return this.findOne({ previousId, userId: user.id });
  }

  async getTasks(
    user: User,
    getTasksDto: GetTasksDto,
  ): Promise<ReadonlyArray<Task>> {
    return this.find({
      where: {
        userId: user.id,
        date: Between(getTasksDto.startDate, getTasksDto.endDate),
      },
    });
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
    task.user = user;
    await this.save(task);

    // remove sensitive data from Task
    delete task.user;

    return task;
  }

  async updateTask(
    user: User,
    taskId: number,
    taskDto: TaskDto,
  ): Promise<Task> {
    // fetch the task first
    const task = await this.getTaskById(taskId, user);
    if (!task) {
      return null;
    }

    // must implement mapper tk
    task.date = taskDto.date;
    task.title = taskDto.title;
    task.details = taskDto.details;
    task.complete = taskDto.complete;
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
    tasksIds: ReadonlyArray<number>,
  ): Promise<ReadonlyArray<Task>> {
    return this.createQueryBuilder('task')
      .whereInIds(tasksIds)
      .andWhere('task.userId = :userId', { userId })
      .getMany();
  }
}
