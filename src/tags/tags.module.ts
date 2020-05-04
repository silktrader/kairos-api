import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './models/tag.entity';
import { AuthModule } from 'src/auth/auth.module';
import { TaskTag } from './models/task-tag.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Tag, TaskTag])],
  exports: [TagsService],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
