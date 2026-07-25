import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { loginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pessoa } from 'src/pessoas/entities/pessoa.entity';
import { HashingService } from './hashing/hashing.service';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Pessoa)
    private readonly pessoaRepository: Repository<Pessoa>,
    private readonly hashService: HashingService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfigs: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: loginDto) {
    const pessoa = await this.pessoaRepository.findOneBy({
      email: data.email,
    });

    if (!pessoa) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await this.hashService.compare(
      data.password,
      pessoa.password,
    );

    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const acessToken = await this.jwtService.signAsync({
      sub: pessoa.id,
      email: pessoa.email,
    });

    return acessToken;
  }
}
