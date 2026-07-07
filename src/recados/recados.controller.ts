import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RecadosService } from './recados.service';
import { CreateRecadoDto } from './dto/create-recado.dto';
import { UpdateRecadoDto } from './dto/update-recado.dto';

@Controller('recados')
export class RecadosController {
  constructor(private readonly service: RecadosService) {}
  // /recados/
  @Get()
  findAll(@Query() pagination: { page?: number; limit?: number }) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 10;

    return this.service.findAll(page, limit);
  }

  // /recados/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() CreateRecadoDto: CreateRecadoDto) {
    return this.service.create(CreateRecadoDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() UpdateRecadoDto: UpdateRecadoDto,
  ) {
    return this.service.update(id, UpdateRecadoDto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}
