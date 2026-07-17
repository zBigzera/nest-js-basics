import { Module } from '@nestjs/common';
import { RecadosController } from './recados.controller';
import { RecadosService } from './recados.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recado } from './entities/recado.entity';
@Module({
  controllers: [RecadosController],
  providers: [RecadosService],
  imports: [TypeOrmModule.forFeature([Recado])],
})
export class RecadosModule {}
