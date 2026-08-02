## 7. Interceptors (Interceptadores)
O decorator `@UseInterceptors(...interceptors)` executa código antes e depois da execução do método.
São extremamente úteis para:
- Registrar logs e medir tempo de execução.
- Transformar as respostas ou exceções.
- Implementar cache.

Implementam a interface `NestInterceptor`.
O método `intercept` recebe o `ExecutionContext` e o `CallHandler` (a ponte para o Controller, retornando um `Observable` via RxJS).
Tudo antes do `next.handle()` é executado na "ida"; tudo dentro do `.pipe()` do RxJS (como `tap` para logs ou `map` para transformar dados) ocorre na "volta".

Por padrão, a estrutura gerada se parece com isso:

```ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class MeuInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle();
  }
}
```

O método `intercept` recebe dois parâmetros fundamentais:
- **1º parâmetro (`context`):** O `ExecutionContext`. Ele fornece detalhes sobre a requisição atual (ex: acessar o objeto `Request` e `Response` do HTTP).
- **2º parâmetro (`next`):** O `CallHandler`. Ele é a "ponte" para o seu Controller. Se você **não** chamar o `next.handle()`, o método do seu Controller nunca será executado e a requisição ficará travada.