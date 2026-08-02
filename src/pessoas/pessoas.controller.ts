import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { PessoasService } from './pessoas.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
  AuthTokenGuard,
  type jwtPayload,
} from 'src/auth/guards/auth-token.guard';
import { User } from 'src/auth/params/user.param';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('pessoas')
export class PessoasController {
  constructor(private readonly pessoasService: PessoasService) {}

  @Post()
  create(@Body() createPessoaDto: CreatePessoaDto) {
    return this.pessoasService.create(createPessoaDto);
  }

  @Get()
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  findAll(@Query() pagination: PaginationDto) {
    return this.pessoasService.findAll(pagination);
  }

  @Post('upload-picture')
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async uploadPicture(
    @User() user: jwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 10 * (1024 * 1024),
          }),
          new FileTypeValidator({
            fileType: /^image\//,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.pessoasService.uploadPicture(file, user);
  }

  @Get(':id')
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: number) {
    return this.pessoasService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  update(
    @Param('id') id: number,
    @Body() updatePessoaDto: UpdatePessoaDto,
    @User() user: jwtPayload,
  ) {
    return this.pessoasService.update(id, updatePessoaDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: number, @User() user: jwtPayload) {
    return this.pessoasService.remove(id, user);
  }
}
