import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PadronizeExceptionFilter } from 'src/common/filters/padronize-exception.filter';
import { AddHeaderInterceptor } from 'src/common/interceptors/add-header.interceptor';
import { PadronizeResponseInterceptor } from 'src/common/interceptors/padronize-response.interceptor';
import { ParseIntIdPipe } from 'src/common/pipes/parse-int-id.pipe';

export default (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
    new ParseIntIdPipe(),
  );

  app.useGlobalInterceptors(
    new AddHeaderInterceptor(),
    new PadronizeResponseInterceptor(),
  );

  app.useGlobalFilters(new PadronizeExceptionFilter());
};
