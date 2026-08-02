# 10. Injeção de dependência (DI)
Em vez de você instanciar suas classes manualmente (usando `new MinhaClasse()`), você delega essa responsabilidade para o **Contêiner de Inversão de Controle (IoC)** do NestJS. O framework se encarrega de criar as instâncias, gerenciar o ciclo de vida delas (geralmente mantendo uma única instância para a aplicação toda - o padrão *Singleton*) e entregá-las prontas para quem precisar.

Isso traz benefícios enormes: código mais limpo, fácil de testar (pois você pode injetar "mocks" no lugar das dependências reais) e altamente desacoplado.

---

## 1. Providers e a Injeção de Classes (O Padrão)

No jargão do NestJS, qualquer classe que possa ser gerenciada pelo framework é chamada de **Provider**. Para transformar uma classe comum em um Provider, usamos o decorator `@Injectable()`.

### Como funciona na prática?

1. Você anota a classe com `@Injectable()`.
2. Você a declara no array `providers` de um Módulo.
3. Você a solicita no `constructor` de outra classe (como um Controller).

O NestJS lê os tipos do TypeScript no seu construtor, procura no contêiner dele se já existe uma instância daquela classe e, se não houver, ele a cria e injeta para você.

```typescript
import { Injectable, Controller, Get } from '@nestjs/common';

// 1. O Decorator avisa ao NestJS: "Você pode gerenciar esta classe"
@Injectable()
export class UserService {
  getUsers(): string[] {
    return ['Ana', 'Carlos'];
  }
}

// 2. O Controller precisa do UserService.
@Controller('users')
export class UserController {
  // A mágica acontece aqui: ao declarar "private readonly userService: UserService",
  // o NestJS entende o que você precisa e entrega a instância pronta.
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.getUsers(); // Já podemos usar sem nunca ter feito um "new UserService()"
  }
}
````

## 2. Encapsulamento de Providers

Uma regra de ouro no NestJS: **Providers são privados por padrão.**

Se você criou o `UserService` dentro do `UserModule`, ele só existe ali dentro. Se o `OrderModule` tentar injetar o `UserService`, o NestJS vai estourar um erro dizendo que não conhece essa dependência.

Para resolver isso, você precisa "abrir a porta" do módulo exportando o provider.

```ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';

@Module({
  providers: [UserService],
  exports: [UserService], // Agora, qualquer módulo que importar o UserModule terá acesso ao UserService
})
export class UserModule {}
```

## 3. Custom Providers (Provedores Customizados)

A injeção baseada em classes (explicada no item 1) cobre 90% dos casos. Mas e se você precisar injetar uma string constante? E se quiser decidir qual classe usar dependendo se está em Produção ou Desenvolvimento? É aqui que entram os Custom Providers.

Em vez de passar apenas o nome da classe no array de `providers`, passamos um objeto detalhado. O campo `provide` é o **Token** (o "nome" da dependência), e os campos `useValue`, `useClass` ou `useFactory` ditam como ela será criada.

### 3.1. `useValue` (Injetando Valores e Variáveis)

Use isso quando a sua dependência não for uma classe a ser instanciada, mas sim um valor estático, uma biblioteca externa que não usa classes (como funções do Node puro) ou um objeto falso (mock) para testes.

```ts
// Objeto simples que queremos injetar em vários lugares
const configDoBanco = {
  host: 'localhost',
  porta: 5432
};

@Module({
  providers: [
    {
      provide: 'DATABASE_CONFIG', // Criamos um token manual, uma string.
      useValue: configDoBanco,    // O NestJS vai simplesmente entregar esse valor exato.
    },
  ],
})
export class AppModule {}
```

**Como resgatar isso?** Como não temos uma classe `DATABASE_CONFIG` para o TypeScript ler no construtor, precisamos usar o decorator `@Inject()`.

```ts
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class DatabaseService {
  // O @Inject() diz ao NestJS exatamente qual token procurar no contêiner.
  constructor(@Inject('DATABASE_CONFIG') private config: any) {
    console.log(`Conectando no host: ${this.config.host}`);
  }
}
```

### 3.2. `useClass` (Trocando Implementações)

O `useClass` permite que você declare uma interface ou classe genérica como Token, mas diga ao NestJS para instanciar uma classe completamente diferente na hora de rodar. É excelente para criar abstrações ou trocar serviços em tempo real.

```ts
const provedorDeEmail = {
  provide: EmailService, // O token (o que os controllers vão pedir)
  useClass: process.env.NODE_ENV === 'production' 
    ? SendGridEmailService  // Se for produção, use a API paga real
    : FakeEmailService,     // Se for desenvolvimento, use um serviço falso para não gastar dinheiro
};

@Module({
  providers: [provedorDeEmail],
})
export class EmailModule {}
```

### 3.3. `useFactory` (Fábricas Dinâmicas e Assíncronas)

_Este é o ponto que costuma gerar mais confusão._

O `useFactory` é usado quando a criação da sua dependência **exige lógica ou precisa esperar algum processo externo** (como buscar dados na internet ou conectar a um banco de dados). Em vez do NestJS instanciar a classe automaticamente, **ele chama uma função que você escreveu**, e o que essa função retornar se tornará o Provider.

Vamos detalhar passo a passo o exemplo:

TypeScript

```ts
const connectionFactory = {
  provide: 'DATABASE_CONNECTION', // 1. O Token (o nome da dependência)
  
  // 2. A Fábrica. Pode ser assíncrona. O que retornar daqui é o que será injetado nos controllers.
  useFactory: async (optionsProvider: OptionsProvider) => {
    // Pegamos opções do provedor auxiliar
    const options = optionsProvider.getOptions();
    
    // Fazemos algo que demora (conexão com DB, chamadas de rede, etc)
    const connection = await createConnection(options);
    
    // O retorno final. É este objeto 'connection' que vai circular pela aplicação.
    return connection; 
  },
  
  // 3. A Injeção de dependências DENTRO da fábrica.
  inject: [OptionsProvider], 
};
```

**Dissecando o `inject: [OptionsProvider]`:**

A função `useFactory` não vive no vácuo; ela pode precisar de outras dependências (neste caso, o `OptionsProvider`) para fazer o seu trabalho.

O array `inject` é a forma que temos de dizer ao NestJS: _"Ei, antes de executar a minha função useFactory, por favor procure o provedor `OptionsProvider` no seu contêiner e passe ele como argumento para a minha função"_.

A ordem dos itens no array `inject` deve ser exatamente a mesma ordem dos parâmetros na função `useFactory`.

## 4. Dependência Circular (Circular Dependency)

Uma dependência circular é um problema de arquitetura. Ocorre quando:

- O **Service A** precisa do **Service B** no construtor.
    
- O **Service B** precisa do **Service A** no construtor.
    

O contêiner do NestJS entra em colapso mental: _Para criar o A, eu preciso do B pronto. Mas para criar o B, eu preciso do A pronto. Quem eu crio primeiro?_ E o aplicativo trava com um erro.

### A Solução: `forwardRef()`

O ideal é sempre refatorar seu código (criando um Service C que guarda a lógica comum, por exemplo). Mas, se você realmente precisar da dependência circular, o NestJS fornece a função utilitária `forwardRef()`.

Ela basicamente diz ao NestJS: _"Guarde uma referência temporária disso aqui. Pode instanciar as classes; eu prometo que a dependência vai estar lá quando eu precisar usar"_.

Você precisa usar isso em **ambos** os lados.

**Lado do Service A:**

```ts
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ServiceB } from './service-b.service';

@Injectable()
export class ServiceA {
  constructor(
    // Envolvemos a dependência no Inject() e forwardRef()
    @Inject(forwardRef(() => ServiceB))
    private serviceB: ServiceB,
  ) {}
}
```

**Lado do Service B:**


```ts
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ServiceA } from './service-a.service';

@Injectable()
export class ServiceB {
  constructor(
    // Fazemos exatamente o mesmo do outro lado
    @Inject(forwardRef(() => ServiceA))
    private serviceA: ServiceA,
  ) {}
}
```

_Dica:_ Se a dependência circular estiver ocorrendo entre dois **Módulos** diferentes (Module A importando Module B, e vice-versa), você também precisa usar o `forwardRef()` no array `imports` de ambos os arquivos de módulo.