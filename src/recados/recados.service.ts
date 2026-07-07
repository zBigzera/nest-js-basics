import { Injectable, NotFoundException } from '@nestjs/common';
import { RecadoEntity } from './entities/recado.entity';
import { CreateRecadoDto } from './dto/create-recado.dto';
import { UpdateRecadoDto } from './dto/update-recado.dto';

@Injectable()
export class RecadosService {
  private lastId = 2;
  private recados: RecadoEntity[] = [
    {
      id: 1,
      texto: 'Teste',
      de: 'Eu',
      para: 'Você',
      lido: true,
      data: new Date(),
    },
    {
      id: 2,
      texto: 'Teste 2',
      de: 'Eu',
      para: 'Você',
      lido: false,
      data: new Date(),
    },
  ];

  findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;
    return this.recados.slice(offset, offset + limit);
  }

  findOne(id: number) {
    const recado = this.recados.find((r) => r.id == id);

    if (recado) return recado;

    throw new NotFoundException('Recado não encontrado', 'Não encontrado');
  }

  create(createRecadoDto: CreateRecadoDto) {
    this.lastId++;
    const novoRecado: RecadoEntity = {
      id: this.lastId,
      ...createRecadoDto,
      lido: false,
      data: new Date(),
    };
    this.recados.push(novoRecado);

    return novoRecado;
  }

  update(id: number, UpdateRecadoDto: UpdateRecadoDto) {
    const recadoExistenteIdx = this.recados.findIndex((r) => r.id == id);

    if (recadoExistenteIdx < 0) {
      throw new NotFoundException('Recado não encontrado', 'Não encontrado');
    }

    const recadoExistente = this.recados[recadoExistenteIdx];

    this.recados[recadoExistenteIdx] = {
      ...recadoExistente,
      ...UpdateRecadoDto,
    };

    return this.recados[recadoExistenteIdx];
  }

  delete(id: number) {
    const recadoExistenteIdx = this.recados.findIndex((r) => r.id == id);

    if (recadoExistenteIdx < 0) {
      throw new NotFoundException('Recado não encontrado', 'Não encontrado');
    }

    this.recados.splice(recadoExistenteIdx, 1);

    return true;
  }
}
