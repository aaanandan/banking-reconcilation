import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '@app/shared';
import {
  LearningQuestion,
  EntityProfile,
  User,
  Reconciliation,
} from '@app/shared';
import { QuestionManagerServiceController } from './question-manager-service.controller';
import { QuestionManagerServiceService } from './question-manager-service.service';

/**
 * Question Manager Service Module
 *
 * Responsibilities:
 * - Question generation and management
 * - Question queue management (immediate, step_end, session_end, deferred)
 * - Answer processing and validation
 * - Question statistics and tracking
 */
@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([
      LearningQuestion,
      EntityProfile,
      User,
      Reconciliation,
    ]),
  ],
  controllers: [QuestionManagerServiceController],
  providers: [QuestionManagerServiceService],
  exports: [QuestionManagerServiceService],
})
export class QuestionManagerServiceModule {}
