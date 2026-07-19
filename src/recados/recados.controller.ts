import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { RecadosService } from './recados.service';
import { CreateRecadoDto } from './dto/create-recado.dto';
import { UpdateRecadoDto } from './dto/update-recado.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ChangeDataInterceptor } from 'src/common/interceptors/change-data.interceptor';

@Controller('recados')
@UseInterceptors(ChangeDataInterceptor)
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
  create(@Body() CreateRecadoDto: CreateRecadoDto) {
    return this.service.create(CreateRecadoDto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() UpdateRecadoDto: UpdateRecadoDto) {
    return this.service.update(id, UpdateRecadoDto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}
