import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MatchOrchestratorModule } from './match-orchestrator.module';

async function bootstrap() {
  const app = await NestFactory.create(MatchOrchestratorModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Banking Reconciliation - Match Orchestrator Service')
    .setDescription(
      'Multi-bank reconciliation system - Orchestrates MT-01 (exact) and MT-02 (fuzzy) matching algorithms in sequence to maximize match rate',
    )
    .setVersion('1.0')
    .addTag('Orchestration', 'Automated workflow coordination for transaction matching')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3005);
  console.log('Match Orchestrator Service is running on port 3005');
  console.log('Swagger documentation available at http://localhost:3005/api');
}
bootstrap();
