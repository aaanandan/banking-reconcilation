import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '@app/shared';
import {
  EntityProfile,
  LearningQuestion,
  UserFeedback,
  User,
} from '@app/shared';
import { LearningServiceController } from './learning-service.controller';
import { LearningServiceService } from './learning-service.service';

/**
 * Learning Service Module
 *
 * Responsibilities:
 * - Entity profile creation and management
 * - User feedback recording and analysis
 * - Pattern learning from reconciliation history
 * - Per-bank behavior tracking
 * - Learning question management
 */
@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([
      EntityProfile,
      LearningQuestion,
      UserFeedback,
      User,
    ]),
  ],
  controllers: [LearningServiceController],
  providers: [LearningServiceService],
  exports: [LearningServiceService],
})
export class LearningServiceModule {}
