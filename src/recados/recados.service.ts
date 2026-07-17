import { Injectable, NotFoundException } from '@nestjs/common';
import { Recado } from './entities/recado.entity';
import { CreateRecadoDto } from './dto/create-recado.dto';
import { UpdateRecadoDto } from './dto/update-recado.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RecadosService {
  constructor(
    @InjectRepository(Recado)
    private readonly recadoRepository: Repository<Recado>,
  ) {}

  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;

    return await this.recadoRepository.find({
      skip: offset,
      take: limit,
    });
  }

  async findOne(id: number) {
    const recado = await this.recadoRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!recado)
      throw new NotFoundException('Recado não encontrado', 'Não encontrado');

    return recado;
  }

  async create(createRecadoDto: CreateRecadoDto) {
    const novoRecado = {
      ...createRecadoDto,
      lido: false,
    };

    const recado = this.recadoRepository.create(novoRecado);

    return await this.recadoRepository.save(recado);
  }

  async update(id: number, UpdateRecadoDto: UpdateRecadoDto) {
    const recadoExistente = await this.recadoRepository.preload({
      id,
      ...UpdateRecadoDto,
    });

    if (recadoExistente) {
      throw new NotFoundException('Recado não encontrado');
    }

    return this.recadoRepository.save(UpdateRecadoDto);
  }

  async delete(id: number) {
    const recadoExistente = await this.recadoRepository.findOneBy({ id });

    if (!recadoExistente) {
      throw new NotFoundException('Recado não encontrado');
    }

    return this.recadoRepository.remove(recadoExistente);
  }
}
