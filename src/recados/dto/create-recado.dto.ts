import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRecadoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  readonly texto!: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  readonly de!: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly para!: number;
}
