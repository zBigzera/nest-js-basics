# 2. Estrutura de um Projeto

O Nest organiza aplicações através de módulos.
Cada módulo representa uma funcionalidade isolada da aplicação.

Exemplo de árvore de diretórios:
```text
src/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── entities/
│   └── dto/
│
├── app.module.ts
└── main.ts
```

## main.ts
Inicializa o Nest e configura recursos **GLOBAIS** antes de qualquer requisição.

## \*.module.ts
Agrupa tudo que pertence a uma funcionalidade.
- Registra controllers.
- Registra services providers.
- Importa outros módulos.
- Exporta módulos.

```ts
@Module({
	imports: [DatabaseModule],
	controllers: [UsersController], 
	providers: [UsersService], 
	exports: [UsersService], 
}) 
export class UsersModule {}
```

## \*.controller.ts
É quem recebe as requisições HTTP.
- Define as rotas.
- Recebe requisições.
- Extrai parâmetros, query e body.
- Chama o Service adequado.
- Retorna uma resposta ao cliente.

```ts
@Controller('users') // Rota para /users
export class UsersController {
 constructor(private readonly usersService: UsersService){} // DI (dependency injection) do service
 @Get('list') // Rota fica /users/list
 findAll() { 
	 return this.usersService.findAll(); 
 } 
}
```

## \*.service.ts
Concentra a lógica de negócio da aplicação.
- Implementa regras de negócio.
- Orquestra operações.
- Comunica com repositories.
- Coordena integrações externas.

```ts
@Injectable() // Decorator necessário para DI
export class UsersService { 
	findAll() {
		return [ 
			 { id: 1, name: 'João' }, 
			 { id: 2, name: 'Maria' }, 
		 ]; 
	 } 
 }
```
