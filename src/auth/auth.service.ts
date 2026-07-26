import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { loginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pessoa } from 'src/pessoas/entities/pessoa.entity';
import { HashingService } from './hashing/hashing.service';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { JwtService } from '@nestjs/jwt';
import { refreshTokenDto } from './dto/refresh-token.dto';
import { jwtPayload } from './guards/auth-token.guard';

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

    return this.createTokens(pessoa);
  }

  private async createTokens(pessoa: Pessoa) {
    const acessToken = await this.getToken(pessoa.id, this.jwtConfigs.ttl, {
      email: pessoa.email,
    });

    const refreshToken = await this.getToken(
      pessoa.id,
      this.jwtConfigs.jwt_refresh_ttl,
    );

    return { acessToken, refreshToken };
  }

  private async getToken<T>(sub: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: sub,
        ...payload,
      },
      {
        expiresIn,
      },
    );
  }

  async refresh(refreshTokenDto: refreshTokenDto) {
    try {
      const tok = await this.jwtService.verifyAsync<jwtPayload>(
        refreshTokenDto.refreshToken,
      );
      console.log(tok);

      const user = await this.pessoaRepository.findOneBy({ id: tok.sub });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Poderia salvar no banco o refresh token e verificar pra tornar ele revogável

      return this.createTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }
}
