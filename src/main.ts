import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import appConfig from './config/app.config';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  appConfig(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    app.enableCors();
  }

  const documentBuilderConfig = new DocumentBuilder()
    .setTitle('Recados API NestJs by Otávio Bigogno')
    .setDescription(
      'Api de recados feita como projeto de estudos com o curso do Otávio Miranda',
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentBuilderConfig);

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.APP_PORT ?? 3000);
}
bootstrap();
