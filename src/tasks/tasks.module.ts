import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { TaskRepository } from './task.repository';
import { TaskTag } from 'src/tags/models/task-tag.entity';
import { TagsModule } from 'src/tags/tags.module';
import { TaskTimer } from './task-timer.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([TaskRepository]),
    TypeOrmModule.forFeature([TaskTag]),
    TypeOrmModule.forFeature([TaskTimer]),
    TagsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
