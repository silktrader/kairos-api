import { Task } from './task.entity';
import { EntityRepository, Repository, Between, Equal } from 'typeorm';
import { TaskDto } from './task.dto';
import { User } from 'src/auth/user.entity';
import { GetTasksDto } from './get-tasks.dto';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  async addTask(taskDto: TaskDto, user: User): Promise<Task> {
    // read the latest task's position
    const task = new Task();
    task.date = taskDto.date;
    task.title = taskDto.title;
    task.details = taskDto.details;
    task.previousId = taskDto.previousId;
    task.user = user;
    await this.save(task);

    // remove sensitive data from Task
    delete task.user;

    return task;
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
}
