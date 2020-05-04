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
import { Connection, Repository, DeleteResult } from 'typeorm';
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
    private readonly taskRepository: TaskRepository,
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
    const task = await this.taskRepository.addTask(taskDto, user);

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

    return this.mapTask(task);
  }

  async updateTask(
    user: User,
    taskId: number,
    taskDto: TaskDto,
  ): Promise<TaskDto> {
    // reference the task and check whether it exists
    const initialTask = await this.taskRepository.getTaskById(taskId, user);

    if (!initialTask) {
      throw new NotFoundException(`Couldn't find task #${taskId}`);
    }

    // reset duration data when the task is incomplete
    taskDto.duration = taskDto.complete ? taskDto.duration : null;

    // tk this should prob happen client side, position checking
    // check whether the date was changed
    const parsedDtoDate = parseISO(taskDto.date);
    if (!isSameDay(parseISO(initialTask.date.toString()), parsedDtoDate)) {
      // append the task to the bottom of the date's task list
      const dateTasks = await this.taskRepository.getTasks(user, {
        startDate: parsedDtoDate,
        endDate: parsedDtoDate,
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

    // select or create tags matching the ones in the DTO
    const initialTaskTagNames: Array<string> = [];

    // check for tag entries to remove
    // for (const taskTag of initialTask.tags) {
    for (let i = initialTask.tags.length - 1; i >= 0; i--) {
      const name = initialTask.tags[i].tag.name;
      initialTaskTagNames.push(name);
      if (!taskDto.tags.includes(name)) {
        this.taskTagRepository.remove(initialTask.tags[i]);
        initialTask.tags.splice(i, 1);
      }
    }

    // add missing tag entries
    for (const tagName of taskDto.tags) {
      // create new task tag entry
      if (!initialTaskTagNames.includes(tagName)) {
        // create new tag when missing or reference an existing one
        const tag = await this.tagsService.getOrAddTag(user, tagName);

        const taskTag = this.taskTagRepository.create({
          task: initialTask,
          tag: tag,
        });
        initialTask.tags.push(taskTag);
        // await this.taskTagRepository.save(taskTag);
      }
    }

    // tk use mapper
    return {
      ...(await this.taskRepository.updateTask(initialTask, taskDto)),
      date: taskDto.date,
      tags: taskDto.tags,
    };
  }

  async updateTasks(
    user: User,
    tasksDtos: ReadonlyArray<TaskUpdateDto>,
  ): Promise<ReadonlyArray<TaskDto>> {
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
    const deletedTask = await this.taskRepository.getTaskById(taskId, user);

    const deletionResult = await this.taskRepository.deleteTask(deletedTask);

    if (deletionResult.affected === 0) {
      throw new NotFoundException();
    }

    // check whether there's a task which references the deleted one
    const affectedTask = await this.taskRepository.getTaskByPreviousId(
      taskId,
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

      return {
        affectedTask: this.mapTask(affectedTask),
      };
    }

    return { affectedTask: null };
  }

  async getTasks(
    user: User,
    dateRangeDto: DateRangeDto,
  ): Promise<ReadonlyArray<TaskDto>> {
    return (await this.taskRepository.getTasks(user, dateRangeDto)).map(
      this.mapTask,
    );
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

  async addTimer(
    user: User,
    taskId: number,
    timestamp: number,
  ): Promise<TaskTimer> {
    // check whether the task exists
    await this.taskRepository.findOneOrFail({ user, id: taskId });

    // create and save entity
    const timer = this.taskTimerRepository.create({
      taskId,
      timestamp: new Date(timestamp),
    });
    return await this.taskTimerRepository.save(timer);
  }

  async deleteTimer(user: User, timerId: number): Promise<DeleteResult> {
    // check whether the timer exists
    const timer = await this.taskTimerRepository.findOneOrFail(timerId);

    return await this.taskTimerRepository.delete(timer);
  }
}
