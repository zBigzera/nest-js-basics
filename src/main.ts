import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ParseIntIdPipe } from './common/pipes/parse-int-id.pipe';
import { AddHeaderInterceptor } from './common/interceptors/add-header.interceptor';
import { TimingConnectionInterceptor } from './common/interceptors/timing-connection.interceptor';
import { PadronizeExceptionFilter } from './common/filters/padronize-exception.filter';
import { PadronizeResponseInterceptor } from './common/interceptors/padronize-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
    new ParseIntIdPipe(),
  );

  app.useGlobalInterceptors(
    new AddHeaderInterceptor(),
    new TimingConnectionInterceptor(),
    new PadronizeResponseInterceptor(),
  );

  app.useGlobalFilters(new PadronizeExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
