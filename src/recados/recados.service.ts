import { Injectable, NotFoundException } from '@nestjs/common';
import { Recado } from './entities/recado.entity';
import { CreateRecadoDto } from './dto/create-recado.dto';
import { UpdateRecadoDto } from './dto/update-recado.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PessoasService } from 'src/pessoas/pessoas.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class RecadosService {
  constructor(
    @InjectRepository(Recado)
    private readonly recadoRepository: Repository<Recado>,
    private readonly pessoasService: PessoasService,
  ) {}

  async findAll(pagination: PaginationDto = {}) {
    const { limit = 10, page = 1 } = pagination;

    const offset = (page - 1) * limit;

    return await this.recadoRepository.find({
      skip: offset,
      take: limit,
      relations: {
        de: true,
        para: true,
      },
      select: {
        de: {
          id: true,
          name: true,
        },
        para: {
          id: true,
          name: true,
        },
      },
    });
  }

  async findOne(id: number) {
    const recado = await this.recadoRepository.findOne({
      where: {
        id: id,
      },
      relations: {
        de: true,
        para: true,
      },
      select: {
        de: {
          id: true,
          name: true,
        },
        para: {
          id: true,
          name: true,
        },
      },
    });

    if (!recado) {
      throw new NotFoundException('Recado não encontrado', 'Não encontrado');
    }

    return recado;
  }

  async create(createRecadoDto: CreateRecadoDto) {
    const de = await this.pessoasService.findOne(createRecadoDto.de);

    const para = await this.pessoasService.findOne(createRecadoDto.para);

    const novoRecado = {
      ...createRecadoDto,
      de: de,
      para: para,
      lido: false,
    };

    const recado = this.recadoRepository.create(novoRecado);
    await this.recadoRepository.save(recado);

    return {
      ...recado,
      de: recado.de.id,
      para: recado.para.id,
    };
  }

  async update(id: number, UpdateRecadoDto: UpdateRecadoDto) {
    const recadoExistente = await this.findOne(id);

    recadoExistente.texto = UpdateRecadoDto?.texto ?? recadoExistente.texto;
    recadoExistente.lido = UpdateRecadoDto?.lido ?? recadoExistente.lido;

    return this.recadoRepository.save(recadoExistente);
  }

  async delete(id: number) {
    const recadoExistente = await this.recadoRepository.findOneBy({ id });

    if (!recadoExistente) {
      throw new NotFoundException('Recado não encontrado');
    }

    return this.recadoRepository.remove(recadoExistente);
  }
}
