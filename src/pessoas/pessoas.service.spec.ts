import { Pessoa } from './entities/pessoa.entity';
import { HashingService } from 'src/auth/hashing/hashing.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PessoasService } from './pessoas.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { QueryFailedError } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { jwtPayload } from 'src/auth/guards/auth-token.guard';
import { promises } from 'fs';

describe('Testando service de pessoas', () => {
  let pessoaService: PessoasService;

  const repositoryMock = {
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    preload: jest.fn(),
    softRemove: jest.fn(),
  };

  const hashMock = {
    hash: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PessoasService,
        {
          provide: getRepositoryToken(Pessoa),
          useValue: repositoryMock,
        },
        {
          provide: HashingService,
          useValue: hashMock,
        },
      ],
    }).compile();

    pessoaService = module.get(PessoasService);
  });

  it('Pessoa service deve estar definido', () => {
    expect(pessoaService).toBeDefined();
  });

  const dto: CreatePessoaDto = {
    name: 'Roberto',
    email: 'xyz@xyz',
    password: '123456',
  };

  describe('create', () => {
    it('Deve criar uma nova pessoa', async () => {
      const passwordHash = 'HASHDESENHA';

      const novaPessoa = {
        id: 1,
        name: dto.name,
        email: dto.email,
        password: passwordHash,
      };

      // Simula valores esperados
      jest.spyOn(hashMock, 'hash').mockResolvedValue(passwordHash);
      jest.spyOn(repositoryMock, 'create').mockReturnValue(novaPessoa);
      jest.spyOn(repositoryMock, 'save').mockResolvedValue(novaPessoa);

      const result = await pessoaService.create(dto);

      expect(hashMock.hash).toHaveBeenCalledWith(dto.password);

      expect(repositoryMock.create).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
        password: passwordHash,
      });

      expect(repositoryMock.save).toHaveBeenCalledWith(novaPessoa);

      expect(result).toEqual(novaPessoa);
    });

    it('Deve lançar conflict exception quando email já existe', async () => {
      jest.spyOn(repositoryMock, 'save').mockRejectedValue(
        new QueryFailedError('', [], {
          code: '23505',
        } as any),
      );

      await expect(pessoaService.create(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('Deve lançar um erro qualquer', async () => {
      jest.spyOn(repositoryMock, 'save').mockRejectedValue(
        new QueryFailedError('Erro genérico', [], {
          name: 'Erro',
          message: 'Erro genérico',
        }),
      );

      await expect(pessoaService.create(dto)).rejects.toThrow(Error);
    });
  });

  describe('findOne', () => {
    it('Deve retornar uma pessoa se exisitr', async () => {
      const pessoaId = 1;
      const pessoaEncontrada = { id: pessoaId, ...dto };

      jest.spyOn(repositoryMock, 'findOne').mockResolvedValue(pessoaEncontrada);

      const result = await pessoaService.findOne(pessoaId);

      expect(result).toEqual(pessoaEncontrada);
    });
  });

  it('Deve retornar uma not found se uma pessoa não existir', async () => {
    const pessoaId = 1;

    jest.spyOn(repositoryMock, 'findOne').mockResolvedValue(null);

    await expect(pessoaService.findOne(pessoaId)).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('findAll', () => {
    it('Deve retornar uma lista de pessoas com paginação', async () => {
      const pessoas = [
        {
          id: 1,
          nome: 'Pessoa um',
          email: 'emailum',
        },
        {
          id: 2,
          nome: 'Pessoa dois',
          email: 'emaildois',
        },
      ];

      jest.spyOn(repositoryMock, 'find').mockResolvedValue(pessoas);

      const result = await pessoaService.findAll({
        limit: 2,
        page: 1,
      });

      expect(repositoryMock.find).toHaveBeenCalledWith({
        skip: 0,
        take: 2,
      });

      expect(result).toEqual(pessoas);
    });
  });

  describe('update', () => {
    const pessoaId = 1;
    const updatePessoaDto: UpdatePessoaDto = {
      ...dto,
      password: 'alterado',
    };
    const user: Partial<jwtPayload> = {
      sub: 1,
    };

    it('Deve retornar uma pessoa atualizada, incluindo a senha', async () => {
      const pessoaAtualizada = {
        id: pessoaId,
        ...updatePessoaDto,
        password: 'SENHA_HASHADA',
      };

      jest.spyOn(hashMock, 'hash').mockResolvedValue('SENHA_HASHADA');

      jest.spyOn(repositoryMock, 'preload').mockResolvedValue(pessoaAtualizada);

      jest.spyOn(repositoryMock, 'save').mockResolvedValue(pessoaAtualizada);

      const result = await pessoaService.update(
        pessoaId,
        updatePessoaDto,
        user as jwtPayload,
      );

      expect(repositoryMock.preload).toHaveBeenCalledWith(pessoaAtualizada);
      expect(result).toEqual(pessoaAtualizada);
      expect(repositoryMock.save).toHaveBeenCalledWith(pessoaAtualizada);
      expect(hashMock.hash).toHaveBeenCalledWith(updatePessoaDto.password);
    });

    it('Deve retornar um erro se um usuário estiver tentando alterar outra pessoa', async () => {
      const result = pessoaService.update(
        2,
        updatePessoaDto,
        user as jwtPayload,
      );

      await expect(result).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('Deve retonar not found por não existir uma pessoa', async () => {
      jest.spyOn(repositoryMock, 'preload').mockResolvedValue(null);

      const result = pessoaService.update(
        pessoaId,
        updatePessoaDto,
        user as jwtPayload,
      );

      await expect(result).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('Deve retornar a pessoa removida', async () => {
      const jwt = { sub: 1 };

      jest.spyOn(repositoryMock, 'findOne').mockResolvedValue(dto);

      jest.spyOn(repositoryMock, 'softRemove').mockResolvedValue(dto);

      const result = await pessoaService.remove(jwt.sub, jwt as jwtPayload);

      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(repositoryMock.softRemove).toHaveBeenCalledWith(dto);

      expect(result).toEqual(dto);
    });

    it('Deve retornar um erro se um usuário estiver tentando excluir outra pessoa', async () => {
      const result = pessoaService.remove(2, { sub: 1 } as jwtPayload);

      await expect(result).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('Deve retonar not found por não existir uma pessoa', async () => {
      jest.spyOn(repositoryMock, 'findOne').mockResolvedValue(null);

      const result = pessoaService.remove(1, { sub: 1 } as jwtPayload);

      await expect(result).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('uploadPicture', () => {
    it('Deve fazer upload de uma foto', async () => {
      const file = {
        originalname: 'teste.png',
        size: 2000,
        buffer: Buffer.from('content'),
      } as Express.Multer.File;

      const pessoa = {
        ...dto,
      };

      jest.spyOn(pessoaService, 'findOne').mockResolvedValue(pessoa as Pessoa);

      jest.spyOn(repositoryMock, 'save').mockResolvedValue({
        ...pessoa,
        picture: '1-pfp.png',
      });

      jest.spyOn(promises, 'mkdir').mockResolvedValue(undefined);
      jest.spyOn(promises, 'writeFile').mockResolvedValue(undefined);

      const result = await pessoaService.uploadPicture(file, {
        sub: 1,
      } as jwtPayload);

      expect(repositoryMock.save).toHaveBeenCalledWith({
        ...pessoa,
        picture: '1-pfp.png',
      });

      expect(promises.mkdir).toHaveBeenCalled();

      expect(result).toEqual({
        ...pessoa,
        picture: '1-pfp.png',
      });
    });

    it('Deve retornar erro se o arquivo for pequeno', async () => {
      const file = {
        originalname: 'teste.png',
        size: 1000,
        buffer: Buffer.from('content'),
      } as Express.Multer.File;

      await expect(
        pessoaService.uploadPicture(file, {
          sub: 1,
        } as jwtPayload),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
// TDD
// Coverage
// // Describe é o "grupo" de testes que esta sendo executado
// describe('Teste.... de teste!', () => {
//   // BeforeEach executa algo antes de cada teste
//   beforeEach(async () => {
//     await new Promise((resolve) => setTimeout(resolve, 3000));
//     console.log('Isto sera executado antes dos testes');
//   });

//   //Isso deveria fazer tal coisa (caso de teste)
//   it('Deve somar 1 e 2 = 3', () => {
//     /**
//      * Pattern ARRANGE (Configurar) - Act (fazer) - Assert (conferir)
//      */

//     // Arrange
//     const numero1 = 1;
//     const numero2 = 2;

//     // Act
//     const result = numero1 + numero2;

//     // Assert
//     // Espero que result seja igual 3
//     expect(result).toBe(3);
//   });
// });
