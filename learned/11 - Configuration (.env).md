# 11. Configuration (.env)

Lidar com variáveis de ambiente (o famoso arquivo `.env`) de forma segura e organizada é crucial em qualquer aplicação. O NestJS fornece um pacote oficial para isso: o `@nestjs/config`, que usa internamente a biblioteca `dotenv`.

**Documentação Oficial (Ponto de Partida):** [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)

---

## 1. O Básico: ConfigModule e `.env`

O primeiro passo é instalar o pacote: `npm i --save @nestjs/config`

Em seguida, importamos o `ConfigModule` no módulo principal (`AppModule`). O `ConfigModule.forRoot()` lê automaticamente o arquivo `.env` na raiz do projeto.

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
  ],
})
export class AppModule {}
````

## 2. A Solução para Variáveis Nativas: Validação com Joi

O NestJS permite usar o **Joi** para garantir que as variáveis existam e sejam do tipo certo _antes_ da aplicação ligar. Se a validação falhar, o NestJS nem sequer inicia o servidor.

**Doc Oficial:** [Schema Validation](https://www.google.com/search?q=https%3A%2F%2Fdocs.nestjs.com%2Ftechniques%2Fconfiguration%23schema-validation)

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}
```

## 3. Estruturando com `registerAs` (Namespaces)

Para evitar erros de digitação e ter auto-complete, agrupamos configurações usando namespaces.

**Doc Oficial:** [Configuration Namespaces](https://www.google.com/search?q=https%3A%2F%2Fdocs.nestjs.com%2Ftechniques%2Fconfiguration%23configuration-namespaces)

**Arquivo `database.config.ts`:**

```ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
}));
```

## 4. Injetando a configuração tipada

Nos serviços, injetamos o namespace DIRETAMENTE usando o `@Inject()`.

```ts
import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import databaseConfig from './config/database.config';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(databaseConfig.KEY)
    private dbConfig: ConfigType<typeof databaseConfig>,
  ) {
    console.log(`Conectando no banco na porta ${this.dbConfig.port}`);
  }
}
```

## 5. Juntando Tudo: Configurando Módulos Assincronamente (`forRootAsync`)

Quando instalamos um módulo externo, como o TypeORM, precisamos passar as credenciais do banco para ele. O problema é: como passamos as variáveis de ambiente para o TypeORM se o `ConfigModule` ainda está processando o `.env`?

A resposta é usar o **`forRootAsync`**. Ele permite que você pause a inicialização do TypeORM e use a Injeção de Dependência (`useFactory`) para injetar as configurações assim que elas estiverem prontas.

**Doc Oficial:** [Async Configuration (TypeORM)](https://www.google.com/search?q=https://docs.nestjs.com/techniques/database%23async-configuration)


```ts
TypeOrmModule.forRootAsync({
  // 1. IMPORTS
  // Aqui você diz ao TypeOrmModule: "Para você se configurar, 
  // você vai precisar do ConfigModule com o namespace databaseConfig".
  imports: [ConfigModule.forFeature(databaseConfig)],

  // 2. INJECT
  // Lembra do guia de Injeção de Dependência? 
  // Aqui estamos dizendo: "Pegue o Token (databaseConfig.KEY) do contêiner 
  // e passe como argumento para a minha função useFactory".
  inject: [databaseConfig.KEY],

  // 3. USEFACTORY
  // É a fábrica que vai construir o objeto final de opções do TypeORM.
  // Graças ao 'inject' acima, o argumento 'dbConfig' chega aqui perfeitamente tipado.
  useFactory: (dbConfig: ConfigType<typeof databaseConfig>) => {
    
    return {
      // 4. SPREAD OPERATOR (...)
      // Pega tudo que você já definiu lá no arquivo database.config.ts 
      // (host, port, username, password, etc) e despeja aqui dentro desse novo objeto.
      ...dbConfig,
      
      // 5. CONFIGURAÇÕES ESPECÍFICAS DO TYPEORM
      // Aqui você adiciona coisas que não vêm do .env, 
      // mas que são comportamentos do TypeORM.
      autoLoadEntities: true, 
      synchronize: true, // (Aviso: deixe 'false' em produção!)
    };
  },
}),
```

### Por que fazer assim e não usar `process.env` direto?

Se você fizesse assim:

TypeScript

```ts
TypeOrmModule.forRoot({
  host: process.env.DATABASE_HOST, // RUIM!
})
```

O NestJS iria tentar conectar no banco _antes_ do `ConfigModule` carregar o arquivo `.env`, e as variáveis chegariam como `undefined`, quebrando a aplicação.