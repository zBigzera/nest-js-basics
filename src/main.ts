import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import appConfig from './config/app.config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  appConfig(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    app.enableCors();
  }

  await app.listen(process.env.APP_PORT ?? 3000);
}
bootstrap();
