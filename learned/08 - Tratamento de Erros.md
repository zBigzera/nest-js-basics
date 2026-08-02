# 8. Tratamento de Erros

## Exceptions HTTP
O Nest possui exceções nativas que lançam erros HTTP já organizados.

Por padrão, o nest possui algumas exceções que lançam erros HTTP já organziados.
Exemplo de retorno:
```ts
throw new NotFoundException('Empresa não encontrada');
```
Retorno
```json
{
  "message": "Empresa não encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```

### Mais usadas
| **Exceção** | **HTTP Status** | **Quando usar** |
| --- | --- | --- |
| **`BadRequestException`** | `400` | O cliente enviou dados inválidos, faltou parâmetro obrigatório ou a validação do DTO falhou. |
| **`UnauthorizedException`** | `401` | Falta de autenticação. |
| **`ForbiddenException`** | `403` | Falta de autorização. |
| **`NotFoundException`** | `404` | O recurso não existe. |
| **`ConflictException`** | `409` | Quebra de regra de unicidade (ex: email já existe). |
| **`UnprocessableEntityException`**| `422` | Sintaxe correta, mas erro semântico. |
| **`InternalServerErrorException`**| `500` | Erro genérico do servidor. |

### Outras
| **Exceção** | **HTTP Status** | **Quando usar** |
| --- | --- | --- |
| **`MethodNotAllowedException`** | `405` | Verbo HTTP errado para a URL. |
| **`RequestTimeoutException`** | `408` | Cliente demorou muito para enviar a requisição. |
| **`PayloadTooLargeException`** | `413` | Arquivo ou corpo ultrapassou o tamanho. |
| **`UnsupportedMediaTypeException`**| `415` | Content-Type não aceito (ex: enviou XML em vez de JSON). |
| **`NotImplementedException`** | `501` | Funcionalidade ou código ainda não implementado. |
| **`BadGatewayException`** | `502` | API externa ou servidor upstream retornou resposta inválida. |
| **`ServiceUnavailableException`** | `503` | Servidor sobrecarregado ou em manutenção. |
| **`ImATeapotException`** | `418` | Brincadeira clássica do protocolo HTTP (RFC 2324). |

## Exception Filters (Filtros de Exceção)
Interceptam o erro antes de chegar ao cliente, permitindo alterar o formato do JSON, fazer logs ou ocultar mensagens sensíveis.
Implementam a interface `ExceptionFilter` e utilizam o decorator `@Catch()`.

Exemplo criando um retorno customizado:
```ts
@Catch(HttpException)
export class HttpCustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      sucesso: false,
      codigoHttp: status,
      dataHora: new Date().toISOString(),
      rota: request.url,
      mensagem: typeof exceptionResponse === 'object' 
        ? exceptionResponse['message'] 
        : exception.message,
    });
  }
}
```
Podem ser aplicados usando `@UseFilters()` em uma rota específica, no Controller inteiro, ou globalmente no `main.ts` com `app.useGlobalFilters()`.
