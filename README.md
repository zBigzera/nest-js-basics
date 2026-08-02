# NestJS - REST API

## Visão Geral

Este diretório contém minhas anotações e estudos sobre NestJS, abordando os principais conceitos do framework através da criação de uma API REST.

O projeto foi desenvolvido durante o curso **["NestJS para REST API com TypeORM, Autenticação JWT e Testes - por Otávio Miranda"](https://www.udemy.com/share/10bKHN3@hjJ6HI9q2YVvWdpc4udmePHaCkUZbj6gWtK3cYCxBAnsOYaTE4gfV0Xl90OAHQVhFw==/)**, sendo uma API de criação de recados, explorando conceitos como arquitetura modular, autenticação JWT, TypeORM, testes automatizados e boas práticas de desenvolvimento backend.

Você pode encontrar as principais anotações sobre o curso em [Ver anotações do curso](./learned)
## Sobre o NestJS

NestJS é um framework backend para Node.js construído com TypeScript. Ele utiliza uma arquitetura baseada em módulos e segue padrões como Injeção de Dependência, facilitando a criação de aplicações organizadas, escaláveis e de fácil manutenção.

## Conceitos abordados

Durante o estudo foram explorados os seguintes tópicos:

### Fundamentos

- Estrutura inicial de um projeto NestJS.
- Organização por módulos.
- Controllers, Services e Providers.
- Uso de decorators.
- Injeção de dependência (Dependency Injection).
- Testes

### Validação e tratamento de dados

- DTOs (Data Transfer Objects).
- Pipes para transformação e validação de dados.
- Tratamento de erros e exceções.

### Autenticação e segurança

- Configuração de variáveis de ambiente.
- Autenticação utilizando JWT.
- Criação e validação de tokens.
- Uso de Guards para proteção de rotas.

### Banco de dados

- Integração com TypeORM.
- Entidades e relacionamentos.
- Configuração da conexão com banco de dados.

### Recursos adicionais

- Interceptors para manipulação do fluxo de requisições.
- Upload de arquivos.
- Testes unitários.
- Testes E2E.

## Tecnologias utilizadas

- Node.js
- TypeScript
- NestJS
- TypeORM
- JWT
- Jest

# Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```