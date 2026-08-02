# 14 - Testes Unitários

## O que são Testes Unitários?
Testes unitários são testes automatizados que verificam o funcionamento da **menor unidade isolada** do código (funções, métodos ou classes). 

O objetivo principal é validar o comportamento dessa regra sem depender de banco de dados, chamadas HTTP de rede ou serviços externos.

---

### Padrão AAA (Arrange, Act, Assert)
Todo teste unitário bem estruturado segue três etapas sequenciais:

1. **Arrange (Preparar):** Configura os dados de entrada, instancia as classes e define o comportamento dos mocks.
2. **Act (Agir):** Executa o método/função real que está sendo testado.
3. **Assert (Verificar):** Checa se o resultado obtido foi exatamente o esperado.

---

## Estrutura e Funções do Framework (Jest)

### 1. Blocos Principais
* **`describe('Módulo', () => {})`**: Bloco usado para agrupar testes relacionados (uma suíte de testes).
* **`it('deve fazer algo', () => {})`** (ou `test`): Define um caso de teste individual. O nome deve ser legível e descritivo.

### 2. Ciclos de Vida (Hooks)
Servem para preparar ou limpar o estado da aplicação antes e depois das execuções:

* `beforeAll()`: Executado **uma vez** antes de rodar o primeiro teste daquele bloco.
* `beforeEach()`: Executado **antes de cada** teste individual. *(Ideal para resetar mocks e instâncias)*.
* `afterEach()`: Executado **após cada** teste individual.
* `afterAll()`: Executado **uma vez** ao final de todos os testes.

---

### 3. Principais Asserções (`expect`)

| Asserção                     | O que valida?                                          | Exemplo                                    |
| :--------------------------- | :----------------------------------------------------- | :----------------------------------------- |
| **`toBe()`**                 | Igualdade estrita (===) para tipos primitivos          | `expect(status).toBe(200)`                 |
| **`toEqual()`**              | Comparação profunda de objetos/arrays                  | `expect(res).toEqual({ id: '1' })`         |
| **`toBeDefined()`**          | Garante que o valor **não** é `undefined`              | `expect(user).toBeDefined()`               |
| **`toBeNull()`**             | Garante que o valor é exatamente `null`                | `expect(error).toBeNull()`                 |
| **`toHaveBeenCalled()`**     | Valida se uma função mock foi chamada                  | `expect(mockFn).toHaveBeenCalled()`        |
| **`toHaveBeenCalledWith()`** | Valida se a função mock recebeu parâmetros específicos | `expect(mockFn).toHaveBeenCalledWith('1')` |
| **`toThrow()`**              | Valida se um método lançou uma exceção                 | `expect(() => fn()).toThrow()`             |

---

### 4. Entendendo Mocks (`jest.fn()`)
Mocks são **simulações** de partes do sistema (como bancos de dados ou APIs) para isolar a unidade que estamos testando.

* **`jest.fn()`**: Cria uma função dublê manipulável.
* **`mockReturnValue(valor)`**: Define um retorno síncrono para o mock.
* **`mockResolvedValue(valor)`**: Retorna uma `Promise` resolvida (para funções `async`).
* **`mockRejectedValue(erro)`**: Retorna uma `Promise` rejeitada com um erro (para simular falhas).

---

## Exemplos Práticos do Dia a Dia

### 1. Validando DTOs (`create-pessoa.dto.spec.ts`)
Valida as regras de entrada de dados antes que alcancem o controller.

```typescript
import { validate } from 'class-validator';
import { CreatePessoaDto } from './create-pessoa.dto';

describe('CreatePessoaDto', () => {
  it('deve validar um DTO correto com sucesso', async () => {
    // Arrange
    const dto = new CreatePessoaDto();
    dto.nome = 'Dev Silva';
    dto.email = 'dev@email.com';
    dto.idade = 25;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('deve retornar erro de validação ao receber um email inválido', async () => {
    // Arrange
    const dto = new CreatePessoaDto();
    dto.nome = 'Dev Silva';
    dto.email = 'email-invalido-aqui';
    dto.idade = 25;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });
});

```

---

### 2. Regra de Negócio / Service (`pessoas.service.spec.ts`)

Testa as regras de negócio simulando as chamadas ao repositório/banco com Mocks.

```typescript
import { PessoasService } from './pessoas.service';
import { NotFoundException } from '@nestjs/common';

describe('PessoasService', () => {
  let service: PessoasService;
  let repositoryMock: any;

  beforeEach(() => {
    // 1. Criamos os mocks do repositório
    repositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
    };

    // 2. Injetamos o mock dentro da instância do serviço
    service = new PessoasService(repositoryMock);
  });

  describe('buscarPorId', () => {
    it('deve retornar os dados de uma pessoa quando o ID existir', async () => {
      // Arrange
      const pessoaFicticia = { id: '1', nome: 'Ana', email: 'ana@email.com' };
      repositoryMock.findById.mockResolvedValue(pessoaFicticia);

      // Act
      const resultado = await service.buscarPorId('1');

      // Assert
      expect(resultado).toEqual(pessoaFicticia);
      expect(repositoryMock.findById).toHaveBeenCalledWith('1');
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
    });

    it('deve lançar NotFoundException quando a pessoa não existir', async () => {
      // Arrange: Repositório retorna null
      repositoryMock.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.buscarPorId('999')).rejects.toThrow(NotFoundException);
    });
  });
});

```

---

### 3. Controller (`pessoas.controller.spec.ts`)

O Controller apenas gerencia requisições e respostas. Testamos se ele invoca o Service corretamente.

```typescript
import { PessoasController } from './pessoas.controller';

describe('PessoasController', () => {
  let controller: PessoasController;
  let serviceMock: any;

  beforeEach(() => {
    // Mock do Service
    serviceMock = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
    };

    controller = new PessoasController(serviceMock);
  });

  describe('criar', () => {
    it('deve chamar o service.criar e devolver a pessoa criada', async () => {
      // Arrange
      const dto = { nome: 'Carlos', email: 'carlos@email.com', idade: 30 };
      const pessoaCriada = { id: 'abc-123', ...dto };

      serviceMock.criar.mockResolvedValue(pessoaCriada);

      // Act
      const resultado = await controller.criar(dto);

      // Assert
      expect(serviceMock.criar).toHaveBeenCalledWith(dto);
      expect(resultado).toEqual(pessoaCriada);
    });
  });
});

```