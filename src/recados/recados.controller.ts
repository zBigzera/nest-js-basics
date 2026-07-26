import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RecadosService } from './recados.service';
import { CreateRecadoDto } from './dto/create-recado.dto';
import { UpdateRecadoDto } from './dto/update-recado.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
  AuthTokenGuard,
  type jwtPayload,
} from 'src/auth/guards/auth-token.guard';
import { User } from 'src/auth/params/user.param';

@Controller('recados')
export class RecadosController {
  constructor(private readonly service: RecadosService) {}
  // /recados/
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  // /recados/:id
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(AuthTokenGuard)
  create(@Body() CreateRecadoDto: CreateRecadoDto, @User() user: jwtPayload) {
    return this.service.create(CreateRecadoDto, user);
  }

  @Put(':id')
  @UseGuards(AuthTokenGuard)
  update(
    @Param('id') id: number,
    @Body() UpdateRecadoDto: UpdateRecadoDto,
    @User() user: jwtPayload,
  ) {
    return this.service.update(id, UpdateRecadoDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthTokenGuard)
  delete(@Param('id') id: number, @User() user: jwtPayload) {
    return this.service.delete(id, user);
  }
}
