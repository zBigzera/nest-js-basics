import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

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
}
