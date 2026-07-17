import { OmitType } from '@nestjs/mapped-types';
import { CreatePessoaDto } from './create-pessoa.dto';

export class UpdatePessoaDto extends OmitType(CreatePessoaDto, [
  'email',
] as const) {}
