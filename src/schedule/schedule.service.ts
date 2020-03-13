import { Injectable } from '@nestjs/common';
import { TaskDto } from './task.dto';
import { DayRespository } from './day.repository';
import { User } from 'src/auth/user.entity';
import { TaskRepository } from './task.repository';
import { Task } from './task.entity';
import { Day } from './day.entity';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly dayRepository: DayRespository,
    private readonly taskRepository: TaskRepository,
  ) {}

  async addTask(user: User, date: Date, taskDto: TaskDto): Promise<Task> {
    // check whether there's already a matching day, else create one
    let day = await this.dayRepository.findOne({ date, user });

    if (!day) {
      day = await this.dayRepository.addDay(date, user);
    }

    const task = await this.taskRepository.addTask(day, taskDto);
    return task;
  }

  async getDay(user: User, date: Date): Promise<Day> {
    return await this.dayRepository.getDay(date, user);
  }
}
