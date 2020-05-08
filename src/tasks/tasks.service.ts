import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TaskDto } from './models/task.dto';
import { User } from 'src/auth/user.entity';
import { Task } from './task.entity';
import { DeleteTaskDto } from './models/deleteTask.dto';
import { Connection, Repository, DeleteResult, In } from 'typeorm';
import { isSameDay, parseISO } from 'date-fns';
import { TaskUpdateDto } from './models/task-update.dto';
import { TagsService } from 'src/tags/tags.service';
import { Tag } from 'src/tags/models/tag.entity';
import { TaskTag } from 'src/tags/models/task-tag.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskTimer } from './task-timer.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskTag)
    private readonly taskTagRepository: Repository<TaskTag>,
    @InjectRepository(TaskTimer)
    private readonly taskTimerRepository: Repository<TaskTimer>,
    private readonly tagsService: TagsService,
    private connection: Connection,
  ) {}

  async addTask(user: User, taskDto: TaskDto): Promise<TaskDto> {
    // select or create tags matching the ones in the DTO
    const tags: Array<Tag> = [];

    for (const name of taskDto.tags) {
      // check if the tag exists
      const tag = await this.tagsService.getOrAddTag(user, name);
      tags.push(tag);
    }

    // create the task without the attached task tags
    const task = this.taskRepository.create({ ...taskDto, tags: [] });
    task.user = user;
    await this.taskRepository.save(task);

    // create the relevant task tags
    const taskTags: Array<TaskTag> = [];
    for (const tag of tags) {
      const taskTag = new TaskTag();
      taskTag.tag = tag;
      taskTag.task = task;
      taskTags.push(taskTag);
    }

    // save all in one transaction
    await this.taskTagRepository.save(taskTags);

    // this isn't ideal but the refetch ensures that all eager relations are reloaded
    return this.mapTask(await this.taskRepository.findOneOrFail(task.id));
  }

  private async getTaskByIdOrFail(id: number, user: User): Promise<Task> {
    return this.taskRepository.findOneOrFail(
      {
        id,
        userId: user.id,
      },
      { relations: ['tags'] },
    );
  }

  private async getTasksInDates(
    user: User,
    dates: Array<string>,
  ): Promise<ReadonlyArray<Task>> {
    return await this.taskRepository.find({
      userId: user.id,
      date: In(dates),
    });
  }

  public async getTasks(user: User, dates: Array<string>) {
    return (await this.getTasksInDates(user, dates)).map(this.mapTask);
  }

  async updateTask(
    user: User,
    taskId: number,
    taskDto: TaskDto,
  ): Promise<TaskDto> {
    // reference the task and check whether it exists
    const task = await this.getTaskByIdOrFail(taskId, user);

    // tk this should prob happen client side, position checking
    // check whether the date was changed
    const parsedDtoDate = parseISO(taskDto.date);
    if (!isSameDay(parseISO(task.date.toString()), parsedDtoDate)) {
      // append the task to the bottom of the date's task list
      const dateTasks = await this.getTasksInDates(user, [taskDto.date]);
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

    // select or create tags matching the ones in the DTO
    const initialTaskTagNames: Array<string> = [];

    // check for tag entries to remove
    // for (const taskTag of initialTask.tags) {
    for (let i = task.tags.length - 1; i >= 0; i--) {
      const name = task.tags[i].tag.name;
      initialTaskTagNames.push(name);
      if (!taskDto.tags.includes(name)) {
        this.taskTagRepository.remove(task.tags[i]);
        task.tags.splice(i, 1);
      }
    }

    // add missing tag entries
    for (const tagName of taskDto.tags) {
      // create new task tag entry
      if (!initialTaskTagNames.includes(tagName)) {
        // create new tag when missing or reference an existing one
        const tag = await this.tagsService.getOrAddTag(user, tagName);

        const taskTag = this.taskTagRepository.create({
          task: task,
          tag: tag,
        });
        task.tags.push(taskTag);
        await this.taskTagRepository.save(taskTag);
      }
    }

    // update all fields
    task.date = taskDto.date;
    task.title = taskDto.title;
    task.details = taskDto.details;
    task.complete = taskDto.complete;
    task.duration = taskDto.duration;
    task.previousId = taskDto.previousId;

    return this.mapTask(await this.taskRepository.save(task));
  }

  async updateTasks(
    user: User,
    tasksDtos: ReadonlyArray<TaskUpdateDto>,
  ): Promise<ReadonlyArray<TaskDto>> {
    const tasks = await this.taskRepository.findByIds(
      tasksDtos.map(dto => dto.id),
      {
        userId: user.id,
      },
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

    // tk mapper
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

    return tasks.map(this.mapTask);
  }

  async deleteTask(user: User, taskId: number): Promise<DeleteTaskDto> {
    // get the task, making sure the user owns it
    const deletedTask = await this.getTaskByIdOrFail(taskId, user);

    // first remove all task tags entries, as cascades are turned off
    const deletedTaskTags = await this.taskTagRepository.find({
      task: deletedTask,
    });
    await this.taskTagRepository.remove(deletedTaskTags);

    // remove the task
    await this.taskRepository.delete(deletedTask);

    // check whether there's a task which references the deleted one
    const affectedTask = await this.taskRepository.findOne(
      { previousId: taskId, userId: user.id },
      { relations: ['tags'] },
    );

    // shorten the linked list and return the affected task
    if (affectedTask) {
      affectedTask.previousId = deletedTask.previousId;
      await this.taskRepository.save(affectedTask);

      return {
        affectedTask: this.mapTask(affectedTask),
      };
    }

    return { affectedTask: null };
  }

  private mapTask(task: Task): TaskDto {
    const { id, title, details, date, complete, duration, previousId } = task;
    const tags = task.tags?.map(taskTag => taskTag.tag.name) ?? [];

    return {
      id,
      title,
      details,
      date,
      complete,
      duration,
      previousId,
      tags,
    };
  }

  /* Timer methods */

  /** Get all the timers related to user owner tasks */
  async getTimers(user: User): Promise<Array<TaskTimer>> {
    return await this.taskTimerRepository
      .createQueryBuilder('taskTimer')
      .leftJoinAndSelect('taskTimer.task', 'task')
      .where('task.userId = :userId', { userId: user.id })
      .getMany();
  }

  /** Check whether the timer exists and ensure that the user owns it */
  async getTimerOrFail(user: User, taskId: number): Promise<TaskTimer> {
    const timer = await this.taskTimerRepository
      .createQueryBuilder('taskTimer')
      .leftJoinAndSelect('taskTimer.task', 'task')
      .where('taskTimer.taskId = :taskId', { taskId })
      .andWhere('task.userId = :userId', { userId: user.id })
      .getOne();
    if (!timer) throw new NotFoundException();
    return timer;
  }

  async addTimer(
    user: User,
    taskId: number,
    timestamp: number,
  ): Promise<TaskTimer> {
    await this.taskRepository.findOneOrFail({ id: taskId, userId: user.id });

    // create and save entity
    const timer = this.taskTimerRepository.create({
      taskId,
      timestamp: new Date(timestamp),
    });
    return await this.taskTimerRepository.save(timer);
  }

  async deleteTimer(user: User, timerId: number): Promise<DeleteResult> {
    // check whether the timer exists and the user owns it
    const timer = await this.getTimerOrFail(user, timerId);

    return await this.taskTimerRepository.delete(timer);
  }
}
