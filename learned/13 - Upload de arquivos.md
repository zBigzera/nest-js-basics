# 13 - Upload de Arquivos

## 1. O Conceito Base e a Integração com o Multer

Na web, arquivos são enviados através de requisições HTTP utilizando o formato `multipart/form-data`. Os analisadores de corpo (body parsers) padrão, que lidam com JSON, ignoram esse formato.

Para resolver isso, o ecossistema Node.js utiliza bibliotecas específicas. O NestJS traz uma integração nativa com o **Multer**, o middleware mais robusto do Express para lidar com uploads. O Nest encapsula a complexidade do Multer em **Interceptors**, permitindo que você lide com arquivos de forma declarativa e tipada.

## 2. O Fluxo de Upload: Da Requisição ao Controller

Entender o caminho que o arquivo percorre é crucial:

1. **Cliente:** Envia um POST com `Content-Type: multipart/form-data`.
2. **Interceptor (`FileInterceptor`):** Atua antes da requisição chegar ao corpo do método. Ele intercepta o stream de dados, processa o arquivo (baseado na configuração de memória ou disco) e o anexa ao objeto da requisição.
3. **Decorator (`@UploadedFile()`):** Inspeciona a requisição, extrai o arquivo processado pelo Multer e o entrega diretamente como um argumento para a sua função no Controller.

```ts
// Exemplo do fluxo em código
@Post('upload')
@UseInterceptors(FileInterceptor('documento')) // 1. Captura o campo 'documento'
uploadFile(@UploadedFile() file: Express.Multer.File) { // 2. Entrega pronto para uso
  return file.size;
}
```

## 3. Dissecando o `Express.Multer.File`

Quando o arquivo chega ao Controller, ele é tipado como `Express.Multer.File`. Este objeto é uma mina de ouro de informações:

- `originalname`: O nome original do arquivo no computador do usuário (⚠️ **Nunca confie nele cegamente**).
- `mimetype`: O tipo do arquivo alegado pelo cliente (ex: `image/jpeg`).
- `size`: O tamanho em bytes (excelente para validações manuais).
- `buffer`: Os dados binários brutos do arquivo (disponível apenas no `memoryStorage`).
## 4. Validação de Borda com `ParseFilePipe`

Validar arquivos é uma questão de segurança e estabilidade. O NestJS fornece o `ParseFilePipe` para aplicarmos a regra de "Falhar Rápido" (Fail Fast) logo na entrada do Controller.

- **`MaxFileSizeValidator`:** Impede que arquivos gigantes sobrecarreguem sua memória (Ataque de Negação de Serviço - DoS).
- **`FileTypeValidator`:** Usa Expressões Regulares (Regex) para checar o `mimetype` da requisição.

```ts
@UploadedFile(
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
      new FileTypeValidator({ fileType: /^image\// }), // Apenas imagens
    ],
  }),
)
```

### 🚨 A Ilusão do MIME Type e a Solução `file-type`

O `FileTypeValidator` e o campo `mimetype` confiam no cabeçalho enviado pelo navegador. Um usuário mal-intencionado pode renomear `virus.exe` para `foto.jpg`. O navegador enviará o mimetype de imagem, enganando sua validação nativa.

**Como resolver?** Usando a biblioteca externa **`file-type`**. Em vez de olhar o nome ou o cabeçalho, ela analisa o **Buffer** (os primeiros bytes do arquivo, conhecidos como _Magic Numbers_ ou assinatura do arquivo) para descobrir sua verdadeira natureza matemática.

## 5. Estratégias de Armazenamento: Memória vs Disco

O Multer opera principalmente em dois modos:

1. **Memory Storage (Padrão):** O arquivo é mantido na memória RAM do servidor (`file.buffer`).
    - _Por que usar?_ Perfeito para manipular a imagem (ex: redimensionar) ou enviar para nuvem (AWS S3).
    - _Perigo:_ Arquivos muito grandes esgotam a RAM.
2. **Disk Storage:** O arquivo é gravado diretamente no disco rígido. O Controller recebe apenas o `path` de onde foi salvo.
    - _Por que usar?_ Alivia a RAM em caso de arquivos maiores.
## 6. Manipulação de Caminhos (Paths)

Sistemas operacionais usam barras diferentes (Windows `\` vs Linux `/`). O módulo nativo `path` resolve isso com segurança:

- **`process.cwd()`:** Retorna o diretório atual de onde o processo Node foi iniciado (muito mais seguro que `__dirname` no Nest, pois evita problemas com a pasta `/dist` gerada no build).
- **`path.join()`:** Une os segmentos preservando as estruturas.
- **`path.resolve()`:** Cria um caminho absoluto a partir da raiz do sistema.
## 7. Escrevendo no Sistema de Arquivos (FS)

Se você usa `memoryStorage` e quer salvar no disco por conta própria, o módulo nativo `fs` (File System) entra em cena:

- **`fs.promises.mkdir`:** O pulo do gato é usar `{ recursive: true }`, que cria todas as pastas pai caso não existam e previne erros se a pasta já existir.
- **`fs.promises.writeFile`:** Pega o `buffer` (os dados brutos) e despeja no caminho absoluto.

```ts
const filePath = path.resolve(process.cwd(), 'uploads', 'avatar.jpg');
await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
await fs.promises.writeFile(filePath, file.buffer); // Gravação direta do buffer
```

## 8. Lidando com Arquivos Gigantes: O Poder das Streams

Se você tentar carregar um vídeo de 2GB usando `memoryStorage` e `writeFile`, seu servidor Node.js vai travar (estouro de memória RAM). Para resolver isso, usamos **Streams**.

Streams dividem o arquivo em pequenos "pedaços" (_chunks_). Em vez de carregar tudo na RAM, o Node lê um pedaço, escreve no disco e descarta da memória.

Em vez de `writeFile` (que espera o arquivo inteiro), usamos `createWriteStream`.

```ts
import * as fs from 'fs';
import { Readable } from 'stream';

// Transforma o buffer do Multer em um Stream de Leitura
const readableStream = Readable.from(file.buffer); 
// Cria um Stream de Escrita apontando para o arquivo no disco
const writeableStream = fs.createWriteStream(filePath);

// O "pipe" conecta os dois. A água (dados) flui da leitura para a escrita, pedaço por pedaço.
readableStream.pipe(writeableStream);

// Você pode aguardar o fim do processo
await new Promise((resolve, reject) => {
  writeableStream.on('finish', resolve);
  writeableStream.on('error', reject);
});
```

_💡 **Nota de Arquitetura:** Se você espera arquivos absurdamente grandes com frequência, o ideal é nem deixar o Multer gerar o `buffer` inicial. Usa-se bibliotecas focadas em stream direto da requisição ou URLs pré-assinadas da AWS (onde o cliente faz upload direto pro S3)._

## 9. Expondo Arquivos para o Frontend: Serve Static

Por segurança, o NestJS e o Express **não expõem** suas pastas do servidor para a web. Se o frontend tentar acessar `http://localhost:3000/uploads/avatar.jpg`, tomará um erro 404 (Not Found).

Para transformar uma pasta local em uma URL pública acessível, usamos o pacote oficial `@nestjs/serve-static`.

**Instalação:** `npm i @nestjs/serve-static`

No seu `app.module.ts`:

```ts
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // 1. Qual pasta física será exposta
      serveRoot: '/arquivos',                   // 2. Qual prefixo na URL (Opcional)
    }),
  ],
})
export class AppModule {}
```

Agora, o arquivo salvo na pasta local `uploads/avatar.jpg` poderá ser acessado pelo frontend na URL: `http://localhost:3000/arquivos/avatar.jpg`.

_⚠️ **Atenção:** Só sirva pastas de forma estática se os arquivos forem públicos (como fotos de perfil). Documentos fiscais ou privados devem passar por uma rota protegida por Guards que valida o usuário e devolve o arquivo por Stream de leitura (usando `StreamableFile` do Nest)._

## 10. Arquitetura: Disco Local vs Nuvem (Amazon S3)

- **Disco Local (`fs` + `ServeStatic`):** Ideal para MVPs, painéis administrativos simples ou projetos monolíticos rodando em um único servidor.
    - _Problema:_ Se a aplicação crescer e você precisar de 2 servidores (Load Balancer), o arquivo salvo no Servidor A dará erro 404 para quem acessar pelo Servidor B.
    
- **Nuvem (AWS S3, Cloudinary):** Padrão da indústria. Seu backend recebe o arquivo e faz stream direto para um bucket (S3). Sua aplicação fica _stateless_ (sem estado local) e infinitamente escalável.