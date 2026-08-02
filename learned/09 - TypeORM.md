# 9. Banco de Dados com TypeORM

Tipo Eloquent ORM no Laravel, usado para SQL e integração com banco de dados.
*Instalação:* `npm i @nestjs/typeorm typeorm <driverSql, pg, mysql,...>`

## Configuração
Em seu `AppModule`, importe o `TypeOrmModule` e suas configurações básicas (não usar `synchronize: true` em produção).

```ts
 imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      database: 'admin',
      username: 'admin',
      password: 'admin',
      autoLoadEntities: true,
      synchronize: true, // NÃO USAR EM PRODUÇÃO, ALTERA O BANCO DE DADOS CONFORME AS ENTITIES
    }),
  ],
```
## Entidades
Definida com o decorator `@Entity('nome_tabela')`.
- **`@PrimaryGeneratedColumn()`**: Cria uma chave primária auto-incremental.
- **`@Column()`**: Define colunas convencionais.

As entidades devem ser registradas no módulo pai usando `TypeOrmModule.forFeature([RecadoEntity])`.

Exemplo

```ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuarios') // Define que a tabela no banco se chamará 'usuarios'
export class Usuario {
  @PrimaryGeneratedColumn() // Cria uma chave primária (ID) auto-incremental
  id: number;

  @Column({ length: 100 }) // Cria uma coluna VARCHAR(100)
  nome: string;

  @Column({ default: true }) // Cria uma coluna booleana com valor padrão
  ativo: boolean;
}
```

**DEVE SER REGISTRADA NO MÓDULO PAI: **
```ts
@Module({
  controllers: [RecadosController],
  providers: [RecadosService],
  imports: [TypeOrmModule.forFeature([RecadoEntity])], // Importado aqui
})
```

### Relacionamentos
#### Um para Um (`@OneToOne`)
Um registro de uma tabela está ligado a apenas um registro de outra. (Ex: Um `Usuario` tem um `Perfil` detalhado).
- **O Lado Dono:** Precisa do decorator `@JoinColumn()`. É aqui que a chave estrangeira (`perfilId`) será criada no banco.
- **O Inverso:** É opcional. Se você quiser buscar o usuário a partir do perfil (bidirecional), você mapeia o inverso.

```ts
// LADO DONO (Tabela que guarda a Foreign Key)
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn() id: number;

  @OneToOne(() => Perfil, (perfil) => perfil.usuario) 
  @JoinColumn() // OBRIGATÓRIO: cria a coluna 'perfilId' em 'usuarios'
  perfil: Perfil;
}

// LADO INVERSO (Opcional, apenas para navegação bidirecional)
@Entity('perfis')
export class Perfil {
  @PrimaryGeneratedColumn() id: number;

  @OneToOne(() => Usuario, (usuario) => usuario.perfil)
  usuario: Usuario; // Não usa JoinColumn aqui
}
````

#### Muitos para Um / Um para Muitos (`@ManyToOne` e `@OneToMany`)
O clássico caso de pai e filho. (Ex: Vários `Posts` pertencem a um `Usuario`).
- **O Lado Dono:** É **Sempre** o `@ManyToOne`. A chave estrangeira (`usuarioId`) sempre fica no lado "Muitos" (a tabela de Posts). Ele não precisa de `@JoinColumn()` (o TypeORM já coloca a chave lá por padrão).
- **O Inverso:** Se você usar o `@OneToMany` (lado Um), o inverso apontando para o `@ManyToOne` é **obrigatório**. Porém, você pode ter o `@ManyToOne` sozinho (vários posts apontando para um usuário, sem o usuário ter a lista de posts).

```ts
// LADO DONO (Lado "Muitos" - Guarda a Foreign Key 'usuarioId')
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn() id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.posts)
  usuario: Usuario; // A chave estrangeira fica aqui
}

// LADO INVERSO (Lado "Um" - Opcional, mas exige o inverso se for usado)
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn() id: number;

  // O inverso `(post) => post.usuario` é OBRIGATÓRIO aqui
  @OneToMany(() => Post, (post) => post.usuario)
  posts: Post[]; 
}
```
#### Muitos para Muitos (`@ManyToMany`)
Registros de ambos os lados podem se relacionar com vários registros do outro. (Ex: `Usuarios` e `Grupos`).

- **O Lado Dono:** Você escolhe quem é o dono. O lado escolhido **precisa** do `@JoinTable()` para gerar a tabela intermediária (pivot) no banco.
- **O Inverso:** Opcional se você só for salvar a relação a partir do dono (unidirecional). Se for bidirecional (ambos os lados mapeados com `@ManyToMany`), o inverso é **obrigatório** nos dois lados para o TypeORM não criar duas tabelas pivot diferentes.

```ts
// LADO DONO (Você escolhe - É de onde você vai gerenciar a relação)
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn() id: number;

  @ManyToMany(() => Grupo, (grupo) => grupo.usuarios)
  @JoinTable() // OBRIGATÓRIO AQUI: Cria a tabela pivot 'usuarios_grupos'
  grupos: Grupo[];
}

// LADO INVERSO (Opcional, para navegação bidirecional)
@Entity('grupos')
export class Grupo {
  @PrimaryGeneratedColumn() id: number;

  @ManyToMany(() => Usuario, (usuario) => usuario.grupos)
  usuarios: Usuario[]; // Não usa JoinTable aqui
}
```
#### Opções Avançadas de Relacionamento (Cascade e OnDelete)

Ao declarar qualquer um dos decorators de relacionamento (como `@OneToMany` ou `@ManyToOne`), você pode passar um objeto de opções como último parâmetro.

- **`cascade`**: Permite que as operações feitas na entidade pai sejam refletidas nos filhos. Se for `true`, ao salvar um `Usuario` que contém um array de `Posts` novos na mesma variável, o TypeORM fará o `INSERT` dos posts automaticamente, sem precisar salvar os posts um a um.
  
- **`onDelete`**: Define o comportamento no banco de dados quando a entidade principal for deletada.
    - `'CASCADE'`: Se o usuário for deletado, todos os posts dele serão deletados no banco automaticamente.
    - `'SET NULL'`: Se o usuário for deletado, a coluna `usuarioId` nos posts vira `NULL` (os posts continuam existindo, mas "órfãos").
    - `'RESTRICT'` ou `'NO ACTION'`: O banco de dados joga um erro e impede a deleção do usuário se ele ainda possuir posts vinculados.

Exemplo de aplicação:

```ts
@ManyToOne(() => Usuario, (usuario) => usuario.posts, {
  onDelete: 'CASCADE', // Deletou o usuário, esse post é deletado do banco
})
usuario: Usuario;

@OneToMany(() => Post, (post) => post.usuario, {
  cascade: true, // Salvar ou atualizar o usuário já salva/atualiza seus posts
})
posts: Post[];
```

#### Como Carregar Relacionamentos (Eager, Lazy e Find Options)

Por padrão, o TypeORM **NÃO** traz os dados dos relacionamentos junto com a consulta para economizar banco e memória. Para utilizá-los, você deve pedir explicitamente:

**1. Usando a opção `relations` (O mais comum)**
Direto no seu Repository com `find()` ou `findOne()`.

```ts
const usuario = await this.usuarioRepository.findOne({
  where: { id: 1 },
  relations: {
	perfil: true, // Nome exato das propriedades na Entidade
	posts: true,
  }, 
});
// Retorno: { id: 1, nome: 'João', perfil: {...}, posts: [{...}, {...}] }
```

**2. Usando Eager Loading (Automático)**

Se você quer que uma relação **SEMPRE** venha preenchida sempre que você buscar aquela entidade, você passa a opção `eager: true` na modelagem. Cuidado para não abusar disso e deixar as consultas lentas.

```ts
@OneToOne(() => Perfil, { eager: true }) 
@JoinColumn()
perfil: Perfil; // Sempre que buscar o Usuário, o perfil virá junto automaticamente
```

**3. Usando Query Builder (`leftJoinAndSelect`)**

Quando você precisa fazer consultas mais complexas, filtrar coisas específicas DENTRO do relacionamento, ou otimizar dados específicos.

```ts
const usuarios = await this.usuarioRepository.createQueryBuilder('usuario')
  .leftJoinAndSelect('usuario.posts', 'post') // Faz o JOIN e já carrega ('Select') os dados do post na variável
  .where('post.ativo = :ativo', { ativo: true }) // Filtra baseado na tabela que foi "joinada"
  .getMany();
```
## Repository
Responsável pelo CRUD sem escrever SQL manualmente.
Injetado no Service com o decorator `@InjectRepository(Entidade)`.

### Principais Métodos
- **`create()`**: Cria na memória, mas não salva.
- **`save()`**: Salva no banco (INSERT se não tiver ID, UPDATE se tiver).
- **`find()`** / **`findOne()`**: Buscam múltiplos ou um único registro.
- **`preload()`**: Usado para UPDATE (busca e mescla os dados).
- **`remove()`**: Remove a instância disparando hooks.
- **`delete()`**: Deleta direto pelo ID ou condição, mais rápido mas não dispara hooks.

### Opções e Operadores de Busca
No método `find`, você pode passar `where`, `select`, `relations` (JOIN), `order`, `take` (LIMIT) e `skip` (OFFSET).
O TypeORM fornece operadores para o `where`, como: `Like`, `ILike`, `MoreThan`, `In`, e `IsNull`.

```ts
import { Like, ILike, MoreThan, In, IsNull } from 'typeorm';

// Exemplo de uso dentro do where:
where: {
  nome: ILike('%joão%'), // Busca ignorando maiúsculas e minúsculas
  id: In([1, 2, 3]),     // Busca quem tem o ID 1, 2 OU 3
  idade: MoreThan(18),   // Busca valores maiores que 18
  email: IsNull(),       // Busca onde a coluna é NULL
},
where: {
	// Outros campos aqui gera um OR
}
```

## Query Builder
Usado para lógicas que o `find()` não faz bem, como agrupamentos (`GROUP BY`), funções matemáticas (`SUM`, `COUNT`), sub-consultas e cláusulas OR/AND complexas.
Inicia-se através do repositório: `this.usuarioRepository.createQueryBuilder('alias')`.


```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';

@Injectable()
export class RelatoriosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async buscarComQueryBuilder() {
    // 'usuario' é o alias (apelido) que usaremos para nos referir à tabela principal
    const query = this.usuarioRepository.createQueryBuilder('usuario');
    
    // ... aqui construímos a consulta
  }
}
```
### Exemplo Prático 1: Busca Avançada e Flexível

Quando você tem muitos filtros opcionais complexos misturando `AND` e `OR`, o Query Builder brilha pela sua sintaxe encadeada:
```ts
  async buscaAvancada(nome?: string) {
    const query = this.usuarioRepository.createQueryBuilder('usuario');

    query.where('usuario.ativo = :ativo', { ativo: true })
         .andWhere('usuario.idade >= :idade', { idade: 18 });

    // Adicionando um filtro opcional dinamicamente
    if (nome) {
      query.andWhere('usuario.nome ILIKE :nome', { nome: `%${nome}%` });
    }

    // getMany() executa a consulta e retorna um array de instâncias da Entidade (igual ao find)
    return await query.getMany(); 
  }
```
### Exemplo Prático 2: Relatórios com JOIN, COUNT e GROUP BY

Aqui é onde o Query Builder se torna insubstituível. Imagine que você quer listar os usuários, trazer os dados deles, e também contar quantos "posts" cada um fez, ordenando por quem tem mais posts.

TypeScript

```ts
  async relatorioUsuariosEngajados() {
    return await this.usuarioRepository.createQueryBuilder('usuario')
      // Faz um LEFT JOIN com a tabela de posts e dá o alias 'post'
      .leftJoin('usuario.posts', 'post')
      
      // Seleciona colunas específicas do usuário
      .select(['usuario.id', 'usuario.nome'])
      
      // Adiciona uma contagem e dá o nome de 'total_posts'
      .addSelect('COUNT(post.id)', 'total_posts')
      
      // Filtra apenas os ativos
      .where('usuario.ativo = :status', { status: true })
      
      // Obrigatório agrupar pelo ID do usuário quando usamos COUNT
      .groupBy('usuario.id')
      
      // Ordena do maior para o menor usando a coluna criada
      .orderBy('total_posts', 'DESC')
      
      // getRawMany() retorna os dados crus, ignorando a formatação exata da Entidade
      // Necessário aqui porque 'total_posts' não é uma coluna da Entidade Usuario
      .getRawMany(); 
  }
```

### Finalizadores de Consulta
- **`getMany()`**: Retorna array de instâncias reais da Entidade.
- **`getOne()`**: Retorna uma única instância ou null.
- **`getRawMany()`**: Retorna array de objetos planos exatos do banco (útil ao usar COUNT/SUM ou joins complexos).
- **`getCount()`**: Retorna apenas o total de registros.

## Transações (Transactions)

Transações garantem que uma série de operações no banco de dados ocorra de forma atômica, ou seja: **ou tudo dá certo, ou nada acontece** (rollback). Se você está salvando um pedido, abatendo o estoque e gerando uma cobrança na mesma requisição, e houver um erro no último passo, a transação desfaz os passos anteriores, evitando dados "quebrados" no banco.

### 1. Como fazer
A forma mais recomendada, limpa e segura de lidar com transações no TypeORM é utilizando o método `.transaction()` diretamente do `DataSource` (ou do `repository.manager`). 

O TypeORM faz o `commit`, `rollback` e libera a conexão automaticamente. Qualquer exceção lançada dentro da callback desfaz todas as ações no banco.

**Exemplo: Passando a transação entre Services**
Aqui, o Service principal abre a transação e passa o `EntityManager` (a variável `t`) adiante para o `EstoqueService`.

```ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Pedido } from './pedido.entity';
import { EstoqueService } from '../estoque/estoque.service';

@Injectable()
export class PedidosService {
  constructor(
    private dataSource: DataSource,
    private estoqueService: EstoqueService,
  ) {}

  async criarPedido(dadosPedido: any) {
    // Iniciamos a transação pelo DataSource global
    return await this.dataSource.transaction(async (t) => {
      
      // 1. Criamos e salvamos o Pedido (SEMPRE USANDO O 't')
      const novoPedido = await t.save(Pedido, {
        clienteId: dadosPedido.clienteId,
        valorTotal: dadosPedido.valorTotal,
      });

      // 2. Chamamos outro service passando a transação 't' por parâmetro
      await this.estoqueService.baixarEstoque(dadosPedido.itens, t);

      // 3. Chegou até aqui sem erros? COMMIT automático!
      return novoPedido;
    }); 
  }
}
````

> **⚠️ AVISO:** Dentro da callback da transação, você **NÃO PODE** usar os repositórios normais injetados (ex: `this.pedidoRepository.save()`). Você deve obrigatoriamente usar o `t` (`EntityManager` transacional) para todas as consultas e persistências lá dentro.

### 2. Bloqueios (Locks) para Concorrência

Mesmo usando transação, você pode sofrer com **Condição de Corrida (Race Condition)**. Imagine que resta apenas `1` item no estoque e dois clientes clicam em "Comprar" no mesmo milissegundo.

Ambos vão ler no banco que tem `1` item, abater `1` e salvar `0`. Resultado: Você vendeu dois produtos, mas só tinha um.

Para evitar isso, usamos **Locks** dentro da transação.

O **Pessimistic Read/Write** avisa ao banco: _"Trave esta linha. Se outra requisição tentar ler/alterar este mesmo dado, faça ela esperar eu terminar minha transação"_.

Veja a implementação no `EstoqueService` recebendo a transação do passo anterior e aplicando o lock:

```ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ItemEstoque } from './item.entity';

@Injectable()
export class EstoqueService {
  constructor(
    @InjectRepository(ItemEstoque)
    private readonly estoqueRepository: Repository<ItemEstoque>,
  ) {}

  // Recebe o transactionManager como opcional
  async baixarEstoque(itensDto: any[], transactionManager?: EntityManager) {
    
    // REGRA DE OURO: Se recebeu a transação, usa ela. Senão, usa o próprio manager.
    const manager = transactionManager || this.estoqueRepository.manager;

    for (const item of itensDto) {
      // O LOCK ENTRA AQUI: impede que outra query altere esta linha
      // até que a transação inteira do PedidosService seja concluída!
      const produto = await manager.findOne(ItemEstoque, { 
        where: { id: item.produtoId },
        lock: { mode: 'pessimistic_write' } 
      });
      
      if (!produto || produto.quantidade < item.quantidade) {
        throw new BadRequestException(`Estoque insuficiente para o produto ${item.produtoId}`);
      }

      produto.quantidade -= item.quantidade;
      
      // Salva usando o manager escolhido
      await manager.save(produto);
    }
    
    return true;
  }
}
```

#### Tipos Comuns de Lock no TypeORM:

- **Pessimista (`pessimistic_write` / `pessimistic_read`):** Trava a linha no banco de dados. Excelente para processos críticos como baixar estoque ou saldos financeiros (Requer uso obrigatório dentro de uma transação).
    
- **Otimista (Optimistic Locking):** Você não trava o banco, mas cria uma coluna na sua Entidade com o decorator `@VersionColumn()`. Se a versão da linha mudar entre o momento que você buscou e o momento que tentou salvar, o TypeORM cancela a operação jogando um erro (`OptimisticLockVersionMismatchError`).