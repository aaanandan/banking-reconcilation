import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'reconciliation_db'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false, // schema fully established by prior sync bootstrap; disabled to avoid concurrent multi-service races
        logging: false,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule, ConfigModule],
})
export class SharedModule {}
