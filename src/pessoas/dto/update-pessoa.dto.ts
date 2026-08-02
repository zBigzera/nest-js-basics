import { CreatePessoaDto } from './create-pessoa.dto';
import { OmitType, PartialType } from '@nestjs/swagger';

export class UpdatePessoaDto extends PartialType(
  OmitType(CreatePessoaDto, ['email'] as const),
) {}
