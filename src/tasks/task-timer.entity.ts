import { Entity, Column, PrimaryColumn, JoinColumn, OneToOne } from 'typeorm';
import { Task } from './task.entity';

@Entity()
export class TaskTimer {
  // explicit column formulation avoids loading the entity when not necessary
  // https://typeorm.io/#/relations-faq/how-to-use-relation-id-without-joining-relation
  @PrimaryColumn()
  taskId: number;

  @OneToOne(() => Task)
  @JoinColumn()
  task: Task;

  @Column('timestamp')
  timestamp: Date;
}
