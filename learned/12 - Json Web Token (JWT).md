## Resumo: JWT e Refresh Token

A ideia básica desta abordagem é:

1. O usuário faz login e recebe dois tokens: um **Access Token** (curta duração) e um **Refresh Token** (longa duração).
2. O **Access Token** é enviado no cabeçalho das requisições (`Authorization: Bearer <token>`).
3. Um **Guard** customizado intercepta as rotas protegidas, extrai o token do cabeçalho e o valida usando o `JwtService`.
4. Quando o Access Token expira, o cliente envia o **Refresh Token** para uma rota específica para gerar um novo par de tokens.

### 1. Instalação das Dependências

```bash
npm install @nestjs/jwt
```
### 2. Configurando o Módulo (JwtModule)

No seu `AuthModule`, você importa o `JwtModule`. Aqui definimos as configurações globais para o Access Token.


```ts
// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'chave-secreta-access-token', // Em produção, use process.env!
      signOptions: { expiresIn: '15m' }, // Access token expira em 15 minutos
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
```

### 3. Criando o Serviço (AuthService)

O serviço é responsável por gerar ambos os tokens e por validar o refresh token. Para o refresh token, assinamos com uma chave secreta diferente e um tempo de expiração maior.

```ts
// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  // Use variáveis de ambiente para estas chaves na vida real!
  private readonly REFRESH_SECRET = 'chave-secreta-refresh-token';

  constructor(private jwtService: JwtService) {}

  async gerarTokens(userId: string) {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      // Gera o Access Token (usa a config do AuthModule: 15m)
      this.jwtService.signAsync(payload),
      
      // Gera o Refresh Token (configuração sobrescrita aqui: 7 dias)
      this.jwtService.signAsync(payload, {
        secret: this.REFRESH_SECRET,
        expiresIn: '7d', 
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      // Valida se o refresh token é autêntico e não expirou
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.REFRESH_SECRET,
      });
      
      // Se válido, gera um novo par de tokens.
      // Dica: Aqui você pode verificar no banco se o usuário ainda está ativo!
      return this.gerarTokens(payload.sub);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }
}
```

### 4. Criando o Guard de Autenticação (AuthGuard)

Construímos um `Guard` que implementa a interface `CanActivate`. Ele vai ler o _header_, extrair o token e tentar verificá-lo.

```ts
// auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      // Verifica o token usando a mesma chave do AuthModule
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'chave-secreta-access-token',
      });
      
      // Anexa os dados do usuário no objeto Request para uso nos Controllers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### 5. Configurando os Controladores (AuthController)

Aqui disponibilizamos as rotas de login, refresh e uma rota de teste protegida pelo nosso `AuthGuard` manual.

```ts
// auth.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { userId: string; senha: string }) {
    // 1. Aqui você faria a validação real de usuário e senha no banco de dados.
    // 2. Se a senha bater, geramos os tokens:
    return this.authService.gerarTokens(body.userId);
  }

  @Post('refresh')
  async refreshToken(@Body() body: { refresh_token: string }) {
    // Recebe o refresh token antigo e devolve um novo par
    return this.authService.refresh(body.refresh_token);
  }

  // Rota Protegida!
  @UseGuards(AuthGuard)
  @Get('perfil')
  getProfile(@Req() req) {
    // O req.user foi injetado pelo nosso AuthGuard
    return {
      mensagem: 'Você acessou uma rota protegida!',
      usuarioId: req.user.sub, 
    };
  }
}
```
