import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { TaskTag } from 'src/tags/models/task-tag.entity';
import { TagsModule } from 'src/tags/tags.module';
import { TaskTimer } from './task-timer.entity';
import { Task } from './task.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Task, TaskTag, TaskTimer]),
    TagsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
