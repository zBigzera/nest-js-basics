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
import { RoutePolicy } from 'src/auth/decorator/RoutePolicy.decorator';
import { RoutePolicies } from 'src/auth/enum/route-policies.enum';
import { RoutePolicyGuard } from 'src/auth/guards/route-policy.guard';

@Controller('recados')
@UseGuards(AuthTokenGuard, RoutePolicyGuard)
export class RecadosController {
  constructor(private readonly service: RecadosService) {}
  // /recados/
  @Get()
  @RoutePolicy(RoutePolicies.findAllRecados)
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  // /recados/:id
  @Get(':id')
  @RoutePolicy(RoutePolicies.findOneRecado)
  findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(AuthTokenGuard)
  @RoutePolicy(RoutePolicies.createRecado)
  create(@Body() CreateRecadoDto: CreateRecadoDto, @User() user: jwtPayload) {
    return this.service.create(CreateRecadoDto, user);
  }

  @Put(':id')
  @UseGuards(AuthTokenGuard)
  @RoutePolicy(RoutePolicies.updateRecado)
  update(
    @Param('id') id: number,
    @Body() UpdateRecadoDto: UpdateRecadoDto,
    @User() user: jwtPayload,
  ) {
    return this.service.update(id, UpdateRecadoDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthTokenGuard)
  @RoutePolicy(RoutePolicies.deleteRecado)
  delete(@Param('id') id: number, @User() user: jwtPayload) {
    return this.service.delete(id, user);
  }
}
