import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RecadosModule } from './recados/recados.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PessoasModule } from './pessoas/pessoas.module';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import * as Joi from 'joi';
import databaseConfig from './config/database.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import path from 'path';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
      isGlobal: true,
      validationSchema: Joi.object({
        DB_TYPE: Joi.required(),
        DB_HOST: Joi.required(),
        DB_PORT: Joi.number().default(5432),
        DB_DATABASE: Joi.required(),
        DB_USERNAME: Joi.required(),
        DB_PASSWORD: Joi.required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (dbConfig: ConfigType<typeof databaseConfig>) => {
        return {
          ...dbConfig,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: path.resolve(process.cwd(), 'pictures'),
      serveRoot: '/pictures',
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
          blockDuration: 5000,
        },
      ],
      errorMessage: 'Você está realizando muitas requisições.',
    }),
    PessoasModule,
    RecadosModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
