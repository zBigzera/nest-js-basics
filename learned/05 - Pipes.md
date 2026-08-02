# 5. Validação e Transformação de Dados (Pipes)

No NestJS, um Pipe é uma classe anotada com `@Injectable()` que implementa a interface `PipeTransform`. Eles operam nos argumentos (parâmetros) processados por um controlador, logo antes de chegarem ao método real da sua rota.

Eles possuem duas responsabilidades principais:
1. **Transformação:** Converter os dados de entrada para o formato desejado (ex: converter uma string `"1"` da URL para o número inteiro `1`).
2. **Validação:** Avaliar os dados de entrada. Se forem válidos, o pipe os passa adiante sem alterações; se forem inválidos, ele lança uma exceção imediatamente, impedindo a execução do controller.

## Escopos de Aplicação
Você pode amarrar um Pipe em três níveis diferentes da aplicação:

- **Global:** Afeta todas as requisições da API. Configurado no `main.ts` usando `app.useGlobalPipes()`.
- **Controller ou Rota:** Aplicado via decorator `@UsePipes()`. Útil quando apenas um Controller ou endpoint precisa de regras de tratamento específicas.
- **Parâmetro (Binding):** Aplicado direto no decorator do parâmetro (`@Param`, `@Query`, `@Body`). É a forma mais comum e limpa de usar os conversores.

## Pipes Nativos (Built-in)
O NestJS já traz vários Pipes prontos, focados principalmente na conversão e validação de tipos primitivos vindos da requisição.

- **`ParseIntPipe` e `ParseFloatPipe`**: Garante que o valor recebido seja numérico e já o converte para o tipo `number` do TypeScript. Se falhar, lança um erro `400 Bad Request`.
  ```ts
  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) { ... }
  ```
- **`ParseBoolPipe`**: Converte strings como `"true"`, `"false"`, `"1"` ou `"0"` para booleanos.
- **`ParseUUIDPipe`**: Garante que a string recebida é um UUID válido. Excelente para segurança, impedindo que injeções ou strings maliciosas cheguem ao seu banco de dados.

```ts
@Get(':id')
buscarPorId(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) 
{ ... }
```
- **`ParseEnumPipe`**: Valida se a string enviada pertence aos valores definidos em um `enum` do TypeScript.
- **`DefaultValuePipe`**: Útil para parâmetros de `@Query`. Se o usuário não enviar aquele parâmetro na URL, este pipe injeta um valor padrão antes de passar para os próximos conversores.

```ts
@Get('produtos')
listar(
	@Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
) 
{ ... }
```
## Criando um Pipe Personalizado

Quando as lógicas nativas não atendem à sua regra de negócio, você pode criar o seu próprio Pipe.

_(Comando CLI: `nest generate pipe <nome>`)_

O coração de qualquer Pipe é o método `transform(value, metadata)`:

- **`value`**: É o dado bruto exato enviado na requisição.
- **`metadata`**: Objeto que contém informações sobre onde o dado foi extraído (body, query, param) e o tipo dele.
-
Se tudo der certo, o método **deve retornar o valor** (transformado ou não). Se algo der errado, ele **deve lançar uma exceção** (como `BadRequestException`).

### Exemplo 1: Pipe de Transformação (Sanitização)

Um pipe que recebe um texto da requisição, limpa espaços sobressalentes e transforma em um `slug` (formato de URL).


```ts
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class SlugifyPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Se não for string (ex: null, undefined, object), passa adiante sem alterar
    if (typeof value !== 'string') {
      return value;
    }
    
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/[\s_-]+/g, '-') // Troca espaços por hífen
      .replace(/^-+|-+$/g, ''); // Remove hifens sobrando nas pontas
  }
}
```

**Como usar:**

```ts
@Post('artigo')
criarArtigo(@Body('titulo', SlugifyPipe) tituloSlug: string) { 
  // Se enviarem "   Meu Artigo TOP!  ", a variável tituloSlug será "meu-artigo-top"
}
```

### Exemplo 2: Pipe de Validação Manual

Um pipe para garantir que um parâmetro de rota de documento siga estritamente o formato `ABC-1234`.

```ts
import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ValidaCodigoDocumentoPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const regexValidador = /^[A-Z]{3}-\d{4}$/;
    
    if (!regexValidador.test(value)) {
      // Se falhar, lançamos o erro. O Controller NUNCA será executado.
      throw new BadRequestException(`O código '${value}' é inválido. Use o padrão ABC-1234.`);
    }
    
    // Se passar na validação, retornamos o valor original para o fluxo continuar
    return value; 
  }
}
```

**Como usar:**

```ts
@Get(':codigo')
buscarDetalhes(@Param('codigo', ValidaCodigoDocumentoPipe) codigo: string) { ... }
```

#nestjs #pipes #validacao #transformacao