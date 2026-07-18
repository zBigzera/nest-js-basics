import { Module } from '@nestjs/common';
import { PessoasService } from './pessoas.service';
import { PessoasController } from './pessoas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pessoa } from './entities/pessoa.entity';

@Module({
  controllers: [PessoasController],
  providers: [PessoasService],
  imports: [TypeOrmModule.forFeature([Pessoa])],
  exports: [PessoasService],
})
export class PessoasModule {}
