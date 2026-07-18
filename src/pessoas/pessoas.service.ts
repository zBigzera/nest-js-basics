import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pessoa } from './entities/pessoa.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PessoasService {
  constructor(
    @InjectRepository(Pessoa)
    private readonly pessoaRepository: Repository<Pessoa>,
  ) {}

  async create(createPessoaDto: CreatePessoaDto) {
    try {
      const personData = {
        ...createPessoaDto,
        password: createPessoaDto.password,
      };

      const newPerson = this.pessoaRepository.create(personData);

      return await this.pessoaRepository.save(newPerson);
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code && error.code === '23505') {
        throw new ConflictException('Email já existente');
      }

      throw error;
    }
  }

  async findAll(pagination: PaginationDto = {}) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    return await this.pessoaRepository.find({
      skip: offset,
      take: limit,
    });
  }

  async findOne(id: number) {
    const pessoa = await this.pessoaRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!pessoa) throw new NotFoundException();

    return pessoa;
  }

  async update(id: number, updatePessoaDto: UpdatePessoaDto) {
    const personData = {
      ...updatePessoaDto,
      password: updatePessoaDto.password,
    };

    const pessoa = await this.pessoaRepository.preload({
      id,
      ...personData,
    });

    if (!pessoa) throw new NotFoundException('Pessoa não encontrada');

    return await this.pessoaRepository.save(pessoa);
  }

  async remove(id: number) {
    const pessoa = await this.pessoaRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!pessoa) throw new NotFoundException();

    return this.pessoaRepository.softRemove(pessoa);
  }
}
