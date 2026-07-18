import { OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRecadoDto } from './create-recado.dto';

export class UpdateRecadoDto extends OmitType(CreateRecadoDto, [
  'de',
  'para',
] as const) {
  @IsOptional()
  @IsBoolean()
  readonly lido?: boolean;
}
