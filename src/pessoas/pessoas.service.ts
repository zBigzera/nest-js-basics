import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Pessoa } from './entities/pessoa.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { HashingService } from 'src/auth/hashing/hashing.service';
import { jwtPayload } from 'src/auth/guards/auth-token.guard';
import path from 'path';
import * as fs from 'fs';

@Injectable()
export class PessoasService {
  constructor(
    @InjectRepository(Pessoa)
    private readonly pessoaRepository: Repository<Pessoa>,
    private readonly hashService: HashingService,
  ) {}

  async create(createPessoaDto: CreatePessoaDto) {
    try {
      const personData = {
        ...createPessoaDto,
        password: await this.hashService.hash(createPessoaDto.password),
      };

      const newPerson = this.pessoaRepository.create(personData);

      return await this.pessoaRepository.save(newPerson);
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
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

  async update(id: number, updatePessoaDto: UpdatePessoaDto, user: jwtPayload) {
    if (id !== user.sub) {
      throw new UnauthorizedException('Você não pode realizar essa operação');
    }

    const personData = {
      ...updatePessoaDto,
    };

    if (updatePessoaDto.password) {
      personData.password = await this.hashService.hash(
        updatePessoaDto.password,
      );
    }

    const pessoa = await this.pessoaRepository.preload({
      id,
      ...personData,
    });

    if (!pessoa) throw new NotFoundException('Pessoa não encontrada');

    return await this.pessoaRepository.save(pessoa);
  }

  async remove(id: number, user: jwtPayload) {
    if (id !== user.sub) {
      throw new UnauthorizedException('Você não pode realizar essa operação');
    }

    const pessoa = await this.pessoaRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!pessoa) throw new NotFoundException();

    return this.pessoaRepository.softRemove(pessoa);
  }

  async uploadPicture(file: Express.Multer.File, user: jwtPayload) {
    if (file.size < 1025) {
      throw new BadRequestException('File too small');
    }
    const ext = path.extname(file.originalname);
    const fileName = `${user.sub}-pfp${ext}`;
    const fileFullPath = path.resolve(process.cwd(), 'pictures', fileName);

    const pessoa = await this.findOne(user.sub);
    pessoa.picture = fileName;

    await this.pessoaRepository.save(pessoa);

    await fs.promises.mkdir(path.dirname(fileFullPath), { recursive: true });

    await fs.promises.writeFile(fileFullPath, file.buffer);

    // TODO: usar uma biblioteca file-type pra validar o arquivo

    return pessoa;
  }
}
