import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DayRespository } from './day.repository';
import { AuthModule } from 'src/auth/auth.module';
import { TaskRepository } from './task.repository';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([DayRespository]),
    TypeOrmModule.forFeature([TaskRepository]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
