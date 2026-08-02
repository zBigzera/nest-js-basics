# 3 - Decorators e ParamDecoratos
Funções especiais do TypeScript que adicionam metadados ou modificam comportamento de métodos, classes e etc.
O NestJS utiliza estes para identificar responsabilidades de cada método, sendo eles "empilháveis".

# Decorators de Classe
- **`@Module(metadata)`**: Define um módulo da aplicação.
  - `imports`: módulos que serão utilizados.
  - `controllers`: controllers pertencentes ao módulo.
  - `providers`: services e outros providers.
  - `exports`: providers que poderão ser utilizados por outros módulos.
- **`@Controller(prefix?)`**: Define um controller, e, opcionalmente, um prefixo pras rotas.
- **`@Injectable()`**: Marca uma classe como **Provider**, permitindo que ela seja utilizada para Injeção de Dependência (DI).

# Decorators de Método
Todos podem receber de prefixo `:VARIAVEL`
- **`@Get(path?)`**: Requisição HTTP GET (READ).
- **`@Post(path?)`**: Requisição HTTP POST (CREATE).
- **`@Put(path?)`**: Requisição HTTP PUT (UPDATE integral).
- **`@Patch(path?)`**: Requisição HTTP PATCH de atualização parcial.
- **`@Delete(path?)`**: Requisição HTTP DELETE.

# Decorators de Parâmetros #param
- **`@Body(property?)`**: Obtém o corpo da requisição.
- **`@Param(property?)`**: Obtém parâmetros da rota (ex: `GET /users/2`).
- **`@Query(property?)`**: Obtém parâmetros da query string (ex: `GET /users?page=2`).
- **`@Headers(property?)`**: Obtém o cabeçalho HTTP.

# Decorators de configuração
Adicionam comportamentos a controllers ou métodos relacionados a autenticação, permissão, validação, logs e tratamento de erros.
- **`@UseGuards(...guards)`**: Guards são executados antes do método do controller e decidem se a requisição pode continuar, utilizados para autenticação, verificar permissões e etc
- **`@UsePipes(...pipes)`**: Os Pipes são responsáveis por validar ou transformar dados recebidos, trabalham em conjunto com DTO. Valida DTO's, converte tipos e garantem que os dados estejam no formato esperado.
- **`@UseInterceptors(...interceptors)`**: Executam um código antes e depois da execução do método. Podem ser usados pra registrar logs, medir tempo de execução, transformar respostas, implementar cache.
## Decorators Customizados (Para Metadados)
Criamos decorators de método ou de classe para "marcar" uma rota com alguma informação, sendo extremamente usados em conjunto com Guards para criar regras dinâmicas.

Exemplo usando `SetMetadata` para definir perfis:
```ts
import { SetMetadata } from '@nestjs/common';

// Cria um decorator que guarda um array de perfis (roles) sob a chave 'roles'
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```
Como aplicar:
```ts
@Post('admin/produtos')
@Roles('admin', 'gerente') // <- Usando nosso decorator
@UseGuards(RolesGuard)     // O Guard vai ler esses metadados
criarProduto() {
  return 'Produto criado';
}
```

### Lendo e validando com `Reflector`
O Guard precisa usar a classe `Reflector` (nativa do `@nestjs/core`) para recuperar a informação definida no Decorator e tomar a decisão.
Exemplo de `RolesGuard`:
```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const perfisExigidos = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!perfisExigidos) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario || !usuario.perfis) {
      return false; // Retorna 403 Forbidden
    }

    return perfisExigidos.some((perfil) => usuario.perfis.includes(perfil));
  }
}
```

## Custom ParamDecorators (Para Parâmetros)
Útil quando você precisa extrair uma informação específica da requisição (Request) repetidas vezes de forma limpa.

Exemplo extraindo o usuário logado (`@User()`):
```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```
Aplicação no Controller (código mais limpo sem expor o objeto completo do Express com `@Req()`):
```ts
@Get('meu-email')
@UseGuards(AuthGuard)
getEmail(@User('email') email: string) {
  return email;
}
```
