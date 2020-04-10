import { EntityRepository, Repository, DeleteResult } from 'typeorm';
import { User } from 'src/auth/user.entity';
import { Habit } from './habit.entity';
import { HabitDto } from './habit.dto';

@EntityRepository(Habit)
export class HabitsRepository extends Repository<Habit> {
  async getHabits(user: User): Promise<ReadonlyArray<Habit>> {
    return this.find({
      where: {
        userId: user.id,
      },
    });
  }

  async addHabit(habitDto: HabitDto, user: User): Promise<Habit> {
    const habit = new Habit();
    habit.title = habitDto.title;
    habit.description = habitDto.description;
    habit.colour = habitDto.colour;
    habit.user = user;
    await this.save(habit);

    // remove sensitive data
    delete habit.user;

    return habit;
  }

  async updateHabit(habit: Habit, habitDto: HabitDto): Promise<Habit> {
    habit.title = habitDto.title;
    habit.description = habitDto.description;
    habit.colour = habitDto.colour;
    await this.save(habit);

    // remove sensitive data
    delete habit.user;

    return habit;
  }

  async deleteHabit(habit: Habit): Promise<DeleteResult> {
    return this.delete(habit);
  }
}
