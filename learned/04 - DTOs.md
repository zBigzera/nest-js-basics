# 4. Transferência de Dados (DTO e Mapped Types)

## DTO (Data Transfer Object)
Usado para definir um contrato estrito de dados a ser recebido ou enviado (entrada ou saída) pela sua API. 

Sozinho, um DTO serve apenas para o TypeScript (em tempo de desenvolvimento). Para que o NestJS valide os dados de fato em tempo de execução, utilizamos os DTOs em conjunto com duas bibliotecas: `class-validator` e `class-transformer`.

*Instalação:* `npm i class-validator class-transformer`

### 1. Aplicando Regras com `class-validator`
O `class-validator` fornece decorators que você coloca nas propriedades do seu DTO para definir as regras que o `ValidationPipe` (configurado globalmente) vai checar.

**Exemplo de DTO enriquecido:**
```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;
  
  @IsString()
  @IsOptional() // Permite que o campo não seja enviado, mas se for, deve ser string
  bio?: string;
}
````

#### whitelist, forbidNonWhitelisted e transform

Controlam o comportamento da aplicação quando são enviadas propriedades que não existem no DTO.
Deve ser configurado nas opções do ValidationPipe:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);

```

* **whitelist:** Remove as propriedades que não estão definidas no DTO.
* **forbidNonWhitelisted:** Retorna erro quando uma propriedade não definida no DTO for enviada.
* **transform:** Habilita a conversão do `@Type` do class-validator.
### 2. Manipulando Dados com `class-transformer`

Enquanto o validador checa as regras, o `class-transformer` é responsável por transformar o JSON puro da requisição em uma instância real da classe DTO. Ele também é incrivelmente útil para **ocultar ou expor** dados na saída da API (retorno do Controller).

- **`@Exclude()`**: Oculta a propriedade. Excelente para DTOs de resposta onde você não quer que a senha do usuário vaze no JSON.
- **`@Expose()`**: Força a exibição de uma propriedade ou cria "alias" (apelidos) para o JSON.
- **`@Type()`**: Força a conversão de um tipo primitivo ou instancia uma classe filha.
### 3. Validação de Objetos Aninhados e Arrays

Um erro muito comum é ter um objeto dentro do DTO e o NestJS não validá-lo. O `class-validator` **não** valida propriedades aninhadas automaticamente. Você precisa avisá-lo!

```ts
import { ValidateNested, IsArray, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';

export class EnderecoDto {
  @IsString()
  rua: string;
}

export class CreateEmpresaDto {
  @IsString()
  nome: string;

  // 1. @ValidateNested() avisa para validar o objeto interno
  // 2. @Type() ensina ao Nest qual classe aquele JSON representa
  @IsDefined()
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco: EnderecoDto;

  @IsArray()
  @ValidateNested({ each: true }) // each: true aplica a validação a CADA item do array
  @Type(() => EnderecoDto)
  filiais: EnderecoDto[];
}
```

## Controller: Recebendo o DTO

No Controller, basta tipar o parâmetro do `@Body()` com o seu DTO. O NestJS (através do ValidationPipe) fará todo o trabalho sujo de barrar a requisição se os dados não baterem com as regras.

```ts
@Post()
create(@Body() createUserDto: CreateUserDto) {
  // Se chegou até aqui, os dados estão 100% validados e tipados!
  return this.usersService.create(createUserDto);
}
```

## Mapped Types

O NestJS possui o pacote `@nestjs/mapped-types`, que permite criar novos DTOs a partir de DTOs existentes, reaproveitando propriedades e, **principalmente, herdando as regras do `class-validator` que você já escreveu.**

São utilizados para evitar duplicação de código em DTOs de criação, atualização e resposta.

_Instalação:_ `npm install @nestjs/mapped-types` _(Nota: Se estiver usando o Swagger, use o pacote `@nestjs/swagger` em vez deste)._

- **`PartialType(Classe)`**: Transforma todas as propriedades do DTO base em opcionais (`@IsOptional()`). Muito utilizado para DTOs de atualização (ex: `UpdateUserDto`).
- **`OmitType(Classe, ['prop'])`**: Cria um novo DTO removendo propriedades específicas (útil para criar DTOs de retorno onde não queremos expor senhas).
- **`PickType(Classe, ['prop'])`**: Cria um novo DTO contendo apenas as propriedades específicas escolhidas do DTO base.
- **`IntersectionType(ClasseA, ClasseB)`**: Combina propriedades de múltiplos DTOs em um só.

**Exemplo de Combinação:**
Você pode aninhar os métodos para criar contratos muito específicos em uma única linha de código:

```ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// Pega o DTO de criação, remove a obrigatoriedade da senha, e deixa todos os outros campos opcionais.
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const)
) {}
```

#nestjs #dto #mapped-types #dados #class-validator #class-transformer