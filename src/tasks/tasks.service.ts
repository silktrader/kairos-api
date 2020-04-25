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
import { Connection, Repository } from 'typeorm';
import { isSameDay, parseJSON, parseISO } from 'date-fns';
import { TaskUpdateDto } from './models/task-update.dto';
import { TagsService } from 'src/tags/tags.service';
import { Tag } from 'src/tags/models/tag.entity';
import { TaskTag } from 'src/tags/models/task-tag.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TasksService {
  constructor(
    private readonly taskRepository: TaskRepository,
    @InjectRepository(TaskTag)
    private readonly taskTagRepository: Repository<TaskTag>,
    private readonly tagsService: TagsService,
    private connection: Connection,
  ) {}

  async addTask(user: User, taskDto: TaskDto): Promise<Task> {
    // select or create tags matching the ones in the DTO
    const tags: Array<Tag> = [];

    for (const tagName of taskDto.tags) {
      // check if the tag exists
      const tag =
        (await this.tagsService.searchTagName(user, tagName)) ??
        (await this.tagsService.saveTag(user, { name }));
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

    return task;
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

    // select or create tags matching the ones in the DTO
    const initialTaskTagNames: Array<string> = [];

    // check for tag entries to remove
    for (const taskTag of initialTask.tags) {
      initialTaskTagNames.push(taskTag.tag.name);
      if (!taskDto.tags.includes(taskTag.tag.name))
        this.taskTagRepository.remove(taskTag);
    }

    // add missing tag entries
    for (const tagName of taskDto.tags) {
      // create new task tag entry
      if (!initialTaskTagNames.includes(tagName)) {
        // create new tag when missing or reference an existing one
        const tag =
          (await this.tagsService.searchTagName(user, tagName)) ??
          (await this.tagsService.addTag(user, { name: tagName }));

        const taskTag = this.taskTagRepository.create({
          task: initialTask,
          tag: tag,
        });
        await this.taskTagRepository.save(taskTag);
      }
    }
    return {
      ...(await this.taskRepository.updateTask(initialTask, taskDto)),
      tags: taskDto.tags,
    };
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

    // tk use dto class-transformer
    return {
      deletedTaskId: deletedTask.id,
      affectedTask: {
        ...affectedTask,
        tags: affectedTask.tags.map(tag => tag.tag.name),
      },
    };
  }

  async getTasks(
    user: User,
    dateRangeDto: DateRangeDto,
  ): Promise<ReadonlyArray<TaskDto>> {
    return (await this.taskRepository.getTasks(user, dateRangeDto)).map(
      this.mapTask,
    );
  }

  mapTask(task: Task): TaskDto {
    const { id, title, details, date, complete, duration, previousId } = task;
    const tags = task.tags.map(taskTag => taskTag.tag.name);

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
}
