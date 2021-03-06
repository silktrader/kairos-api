import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitsRepository } from './habits.repository';
import { HabitEntry } from './habit-entry.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([HabitsRepository, HabitEntry]),
  ],
  controllers: [HabitsController],
  providers: [HabitsService],
})
export class HabitsModule {}
