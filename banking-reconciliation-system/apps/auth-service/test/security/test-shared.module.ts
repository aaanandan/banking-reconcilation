import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [__dirname + '/../../../../libs/shared/src/**/*.entity{.ts,.js}'],
      synchronize: true,
      dropSchema: true,
      logging: false,
    }),
  ],
  exports: [TypeOrmModule, ConfigModule],
})
export class TestSharedModule {}
