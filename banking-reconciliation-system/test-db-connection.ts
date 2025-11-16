import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'reconciliation_db',
  entities: ['libs/shared/src/entities/*.entity.ts'],
  synchronize: false,
});

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully!');
    return AppDataSource.query('SELECT NOW()');
  })
  .then((result) => {
    console.log('✅ Can query database:', result);
    return AppDataSource.destroy();
  })
  .then(() => {
    console.log('✅ Connection closed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
