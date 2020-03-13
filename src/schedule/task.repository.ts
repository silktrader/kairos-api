import { Task } from './task.entity';
import { EntityRepository, Repository } from 'typeorm';
import { Day } from './day.entity';
import { TaskDto } from './task.dto';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  async addTask(day: Day, taskDto: TaskDto): Promise<Task> {
    const task = new Task();
    task.title = taskDto.title;
    task.details = taskDto.details;
    task.order = taskDto.order;
    task.day = day;
    await this.save(task);

    return task;
  }
}
