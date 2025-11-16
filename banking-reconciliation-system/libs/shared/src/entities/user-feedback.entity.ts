// libs/shared/src/entities/user-feedback.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_feedback')
export class UserFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reconciliationId: string;

  @Column()
  transactionId: number;

  @Column({
    type: 'enum',
    enum: ['override', 'rejection', 'manual_match', 'comment'],
  })
  feedbackType: string;

  @Column({ type: 'jsonb', nullable: true })
  originalSuggestion: any;

  @Column({ type: 'jsonb', nullable: true })
  userChoice: any;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.feedbacks)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
