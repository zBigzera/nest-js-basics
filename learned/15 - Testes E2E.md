# Testes E2E
## 1. O que são Testes E2E no NestJS?

Diferente dos testes unitários ou de integração de serviços isolados, o **Teste End-to-End (E2E)** valida o fluxo completo da aplicação. Ele dispara uma requisição HTTP simulada e garante que todos os componentes funcionem juntos:

```
[ Requisição HTTP ] 
       │
       ▼
[ Guards (Auth) / Interceptors ]
       │
       ▼
[ Validation Pipes (DTOs) ]
       │
       ▼
[ Controller ] ──> [ Service ] ──> [ Database Real / Testcontainer ]
       │
       ▼
[ Resposta HTTP (Status Code + Payload) ]
```

## 2. Banco de Dados para Testes: Testcontainers vs. Alternativas


| **Abordagem**                            | **Prós**                                                                                                                            | **Contras**                                                                                                           | **Quando usar?**                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Testcontainers** _(PostgreSQL)_        | • Garanta 100% de paridade com o banco de produção (triggers, dialeto, extensões).<br><br>  <br><br>• Totalmente isolado e efêmero. | • Requer Docker rodando no ambiente.<br><br>  <br><br>• Subir o container inicial adiciona tempo ao setup dos testes. | **Recomendado para pipelines CI/CD e testes E2E fiéis à produção.**                  |
| **SQLite em Memória**                    | • Extremamente rápido.<br><br>  <br><br>• Não precisa de Docker.                                                                    | • Não suporta funções específicas do Postgres (JSONB, enum nativo, sintaxes específicas).                             | Útil para testes rápidos locais se a sua aplicação for simples e agnóstica ao banco. |
| **Banco Docker Fixo** _(Docker Compose)_ | • Rápido para rodar localmente (o container já fica subido).                                                                        | • Risco de vazamento de estado de dados entre execuções se não for limpo adequadamente.                               | Bom para dev local com reaproveitamento de container.                                |

> **Conclusão:** Manter o **Testcontainers** é excelente porque elimina o clássico problema _"funciona na minha máquina, mas falha no CI/CD"_.

## 3. Estrutura de Pastas Sugerida

Para evitar que a pasta `test/` vire uma bagunça à medida que o projeto cresce, organize por domínios e helpers:

Plaintext

```
test/
├── helpers/
│   ├── database.helper.ts      # Subir/derrubar Testcontainers e rodar Migrations
│   ├── auth.helper.ts          # Gerador de Tokens JWT e payloads de autenticação
│   └── app.helper.ts           # Boostrap da aplicação Nest para teste
├── e2e/
│   ├── auth.e2e-spec.ts        # Testes de login/registro
│   └── pessoas.e2e-spec.ts     # Testes do recurso de Pessoas
├── jest-e2e.json               # Configuração do Jest E2E
└── setup-e2e.ts                # Lifecycle global do Jest (subir container uma vez)
```

## 4. Arquivos de Configuração e Helpers

### A. Configuração do Testcontainers e Banco (`database.helper.ts`)

Centralize a lógica para subir o container do Postgres e aplicar as migrations do TypeORM/Prisma antes da suíte de testes rodar:

```TypeScript
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';

export class TestDatabase {
  private static container: StartedPostgreSqlContainer;

  static async startContainer() {
    this.container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_pass')
      .start();

    // Exporta as variáveis de ambiente dinâmicas para o NestJS ler
    process.env.DB_HOST = this.container.getHost();
    process.env.DB_PORT = this.container.getPort().toString();
    process.env.DB_USERNAME = this.container.getUsername();
    process.env.DB_PASSWORD = this.container.getPassword();
    process.env.DB_DATABASE = this.container.getDatabase();
  }

  static async stopContainer() {
    if (this.container) {
      await this.container.stop();
    }
  }

  // Helper opcional para limpar dados entre testes
  static async clearTables(dataSource: DataSource) {
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }
  }
}
```

### B. Helper de Autenticação (`auth.helper.ts`)

Nos testes E2E de rotas protegidas por Guards (`JwtAuthGuard`), precisamos simular a obtenção de um token JWT válido:


```TypeScript
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';

export class AuthHelper {
  static async getAccessToken(app: INestApplication, payload = { sub: '1', email: 'admin@test.com' }): Promise<string> {
    const jwtService = app.get(JwtService);
    return jwtService.sign(payload);
  }

  // Alternativa: Fazer o login real via requisição HTTP
  static async loginViaHttp(app: INestApplication, credentials = { email: 'admin@test.com', senha: '123' }) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials);

    return response.body.access_token;
  }
}
```

## 5. Exemplo Completo de Teste E2E (`pessoas.e2e-spec.ts`)

Aqui juntamos a inicialização do container, rotas públicas, rotas protegidas com JWT e validações com o `supertest`:

```TypeScript
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestDatabase } from './helpers/database.helper';
import { AuthHelper } from './helpers/auth.helper';

describe('Pessoas (E2E)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // 1. Subir container PostgreSQL temporário
    await TestDatabase.startContainer();

    // 2. Compilar o módulo do NestJS com as envs apontadas para o container
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 3. Replicar pipes e filtros globais exatamente como na main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // 4. Gerar token de autenticação para as rotas protegidas
    authToken = await AuthHelper.getAccessToken(app);
  }, 60000); // Timeout estendido para dar tempo de baixar/subir a imagem do container

  afterAll(async () => {
    await app.close();
    await TestDatabase.stopContainer();
  });

  describe('POST /pessoas (Criação)', () => {
    it('deve recusar a requisição sem token de autenticação (401)', async () => {
      await request(app.getHttpServer())
        .post('/pessoas')
        .send({ nome: 'Teste', email: 'teste@email.com' })
        .expect(401);
    });

    it('deve retornar 400 se o payload violar as regras de DTO', async () => {
      await request(app.getHttpServer())
        .post('/pessoas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nome: '' }) // Nome inválido/vazio
        .expect(400);
    });

    it('deve criar um recurso com sucesso quando os dados e token forem válidos (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/pessoas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nome: 'Ana Costa', email: 'ana@email.com' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('Ana Costa');
    });
  });

  describe('GET /pessoas (Listagem)', () => {
    it('deve listar os registros cadastrados (200)', async () => {
      const response = await request(app.getHttpServer())
        .get('/pessoas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
```

## 6. Boas Práticas Indispensáveis para Testes E2E

1. **Sempre Replique as Configurações Globais:** Se a sua aplicação usa `ValidationPipe`, `ExceptionFilters` ou `Interceptors` no `main.ts`, configure-os no app de teste também.
    
2. **Isolamento entre Testes:** Se um teste altera o estado do banco e pode quebrar outro teste, utilize scripts de limpeza de tabelas (`TRUNCATE`) no `afterEach` ou rode migrations limpas.
    
3. **Aumente os Timeouts no Jest para Containers:** Como baixar ou inicializar o Testcontainers pode demorar alguns segundos, adicione um timeout maior no `beforeAll` (ex: `60000ms`).
    
4. **Mocks de Serviços Externos:** Não faça chamadas a APIs pagas ou de terceiros (como Stripe, SendGrid ou AWS S3) durante os testes E2E. Use `overrideProvider` do NestJS para mockar essas integrações específicas:
    

```TypeScript
const moduleFixture = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(EmailService)
  .useValue({ sendEmail: jest.fn().mockResolvedValue(true) })
  .compile();
```