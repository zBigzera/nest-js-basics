import { PessoasController } from './pessoas.controller';
import { PessoasService } from './pessoas.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { jwtPayload } from 'src/auth/guards/auth-token.guard';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';

describe('PessoasController', () => {
  let controller: PessoasController;

  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    uploadPicture: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    controller = new PessoasController(
      serviceMock as unknown as PessoasService,
    );
  });

  it('Create', async () => {
    const fakeDto = {} as CreatePessoaDto;
    const fakeExpected = 'qualquer coisa';

    jest.spyOn(serviceMock, 'create').mockReturnValue(fakeExpected);
    const result = await controller.create(fakeDto);
    expect(serviceMock.create).toHaveBeenCalledWith(fakeDto);
    expect(result).toEqual(fakeExpected);
  });

  it('FindAll', async () => {
    const fakeDto = {} as PaginationDto;
    const fakeExpected = [];

    jest.spyOn(serviceMock, 'findAll').mockReturnValue(fakeExpected);
    const result = await controller.findAll(fakeDto);
    expect(serviceMock.findAll).toHaveBeenCalledWith(fakeDto);
    expect(result).toEqual(fakeExpected);
  });

  it('uploadPicture', async () => {
    const fakeDto = {} as Express.Multer.File;
    const fakeExpected = [];

    jest.spyOn(serviceMock, 'uploadPicture').mockReturnValue(fakeExpected);
    const result = await controller.uploadPicture(
      { sub: 1 } as jwtPayload,
      fakeDto,
    );
    expect(serviceMock.uploadPicture).toHaveBeenCalledWith(fakeDto, { sub: 1 });
    expect(result).toEqual(fakeExpected);
  });

  it('findOne', async () => {
    const fakeId = 1;
    const fakeExpected = {};

    jest.spyOn(serviceMock, 'findOne').mockReturnValue(fakeExpected);
    const result = await controller.findOne(fakeId);
    expect(serviceMock.findOne).toHaveBeenCalledWith(fakeId);
    expect(result).toEqual(fakeExpected);
  });

  it('update', async () => {
    const fakeId = 1;
    const fakeDto = {} as UpdatePessoaDto;
    const fakeExpected = {};

    jest.spyOn(serviceMock, 'update').mockReturnValue(fakeExpected);
    const result = await controller.update(fakeId, fakeDto, {} as jwtPayload);
    expect(serviceMock.update).toHaveBeenCalledWith(
      fakeId,
      fakeDto,
      {} as jwtPayload,
    );
    expect(result).toEqual(fakeExpected);
  });

  it('remove', async () => {
    const fakeId = 1;
    const fakeExpected = {};

    jest.spyOn(serviceMock, 'remove').mockReturnValue(fakeExpected);
    const result = await controller.remove(fakeId, {} as jwtPayload);
    expect(serviceMock.remove).toHaveBeenCalledWith(fakeId, {} as jwtPayload);
    expect(result).toEqual(fakeExpected);
  });
});
