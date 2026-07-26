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

@Controller('pessoas')
export class PessoasController {
  constructor(private readonly pessoasService: PessoasService) {}

  @Post()
  create(@Body() createPessoaDto: CreatePessoaDto) {
    return this.pessoasService.create(createPessoaDto);
  }

  @Get()
  @UseGuards(AuthTokenGuard)
  findAll(@Query() pagination: PaginationDto) {
    return this.pessoasService.findAll(pagination);
  }

  @Get(':id')
  @UseGuards(AuthTokenGuard)
  findOne(@Param('id') id: number) {
    return this.pessoasService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthTokenGuard)
  update(
    @Param('id') id: number,
    @Body() updatePessoaDto: UpdatePessoaDto,
    @User() user: jwtPayload,
  ) {
    return this.pessoasService.update(id, updatePessoaDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthTokenGuard)
  remove(@Param('id') id: number, @User() user: jwtPayload) {
    return this.pessoasService.remove(id, user);
  }
}
