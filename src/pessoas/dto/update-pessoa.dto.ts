import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePessoaDto } from './create-pessoa.dto';

export class UpdatePessoaDto extends PartialType(
  OmitType(CreatePessoaDto, ['email'] as const),
) {}
