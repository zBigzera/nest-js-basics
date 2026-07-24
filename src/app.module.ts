import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RecadosModule } from './recados/recados.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PessoasModule } from './pessoas/pessoas.module';
import { ConfigModule, ConfigType } from '@nestjs/config';
import * as Joi from 'joi';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
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
      imports: [ConfigModule.forFeature(databaseConfig)],
      inject: [databaseConfig.KEY],
      useFactory: (dbConfig: ConfigType<typeof databaseConfig>) => {
        return {
          ...dbConfig,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    PessoasModule,
    RecadosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
