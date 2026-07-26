import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { RoutePolicies } from 'src/auth/enum/route-policies.enum';

export class CreatePessoaDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password!: string;

  @IsEnum(RoutePolicies, { each: true })
  @IsOptional()
  policies?: RoutePolicies[];
}
