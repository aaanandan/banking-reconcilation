import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateManagerServiceController } from './state-manager-service.controller';
import { StateManagerServiceService } from './state-manager-service.service';
import {
  User,
  Reconciliation,
  BankFile,
  LedgerFile,
  Transaction,
  MatchCandidate,
  EntityProfile,
  LearningQuestion,
  ConvergenceMetrics,
  UserFeedback,
} from '@app/shared';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'reconciliation_db',
      entities: [
        User,
        Reconciliation,
        BankFile,
        LedgerFile,
        Transaction,
        MatchCandidate,
        EntityProfile,
        LearningQuestion,
        ConvergenceMetrics,
        UserFeedback,
      ],
      synchronize: false, // Tables already created in Phase 1
    }),
    TypeOrmModule.forFeature([
      Reconciliation,
      BankFile,
      LedgerFile,
      Transaction,
      MatchCandidate,
    ]),
  ],
  controllers: [StateManagerServiceController],
  providers: [StateManagerServiceService],
})
export class StateManagerServiceModule {}
