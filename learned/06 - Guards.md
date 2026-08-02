# 6. Guards

## Guards (Guardiões)
O decorator `@UseGuards(...guards)` aplica um ou mais Guards, que são executados antes do método do controller e decidem se a requisição pode continuar.
Eles são a ferramenta oficial e mais recomendada para:
- Verificar autenticação.
- Verificar permissões (autorização).
- Bloquear acesso a determinadas rotas.

Se retornar `true`, a requisição continua; se `false`, o NestJS bloqueia e lança `403 Forbidden`.
Um Guard é uma classe com o decorator `@Injectable()` que obrigatoriamente implementa a interface `CanActivate`.

**Exemplo: Um Guard de Autenticação Simples**
```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    
    // Pegamos a requisição original
    const request = context.switchToHttp().getRequest();
    
    // Simulando uma validação (ex: checar se existe um header de autorização)
    const token = request.headers.authorization;
    
    if (!token) {
      return false; // Bloqueia a requisição (Retorna 403 Forbidden)
    }

    return true; // Libera o acesso à rota
  }
}
```
