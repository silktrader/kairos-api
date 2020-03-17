import { Task } from './task.entity';
import { EntityRepository, Repository, Between } from 'typeorm';
import { TaskDto } from './task.dto';
import { User } from 'src/auth/user.entity';
import { GetTasksDto } from './get-tasks.dto';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  async addTask(taskDto: TaskDto, user: User): Promise<Task> {
    const task = new Task();
    task.date = taskDto.date;
    task.title = taskDto.title;
    task.details = taskDto.details;
    task.order = taskDto.order;
    task.user = user;
    await this.save(task);

    return task;
  }

  async getTasks(
    user: User,
    getTasksDto: GetTasksDto,
  ): Promise<ReadonlyArray<Task>> {
    return this.find({
      where: { date: Between(getTasksDto.startDate, getTasksDto.endDate) },
    });
  }
}
