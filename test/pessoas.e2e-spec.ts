import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import setupTestDb from './test.config';
import appConfig from 'src/config/app.config';
import { CreatePessoaDto } from 'src/pessoas/dto/create-pessoa.dto';
import { Pessoa } from 'src/pessoas/entities/pessoa.entity';
import { plainToInstance } from 'class-transformer';

interface Responses<T> {
  success: string;
  data: T;
}

describe('Pessoas controller (e2e)', () => {
  let app: INestApplication<App>;

  setupTestDb();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    appConfig(app);
    await app.init();
  });

  describe('POST /pessoas', () => {
    it('Deve criar uma nova pessoa', async () => {
      const createPessoaDto: CreatePessoaDto = {
        email: 'luiz@email.com',
        password: '123456',
        name: 'Luiz Roberto',
      };

      const response = await request(app.getHttpServer())
        .post('/pessoas')
        .send(createPessoaDto)
        .expect(HttpStatus.CREATED);

      const data = (response.body as { data: unknown }).data;

      const pessoa = plainToInstance(Pessoa, data);
      expect(pessoa).toBeInstanceOf(Pessoa);

      expect(data).toMatchObject({
        id: expect.any(Number) as number,
        name: createPessoaDto.name,
        password: expect.any(String) as string,
        email: createPessoaDto.email,
        picture: '',
      });
    });
  });

  describe('Get /pessoas/:id', () => {
    it('Deve retornar unauthorized quando usuário não esta logado', async () => {
      const response = await request(app.getHttpServer())
        .get('/pessoas/' + 1)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body).toEqual({
        success: false,
        status: 401,
        message: 'Token inválido',
        path: '/pessoas/1',
        timestamp: expect.any(String) as string,
      });
    });

    it('Deve retornar uma pessoa quando usuário esta logado', async () => {
      const { body } = (await request(app.getHttpServer()).post('/auth/').send({
        email: 'luiz@email.com',
        password: '123456',
      })) as {
        body: Responses<{
          acessToken: string;
        }>;
      };

      const response = await request(app.getHttpServer())
        .get('/pessoas/' + 1)
        .set('Authorization', `Bearer ${body.data.acessToken}`)
        .expect(HttpStatus.OK);

      expect((response.body as { data: object }).data).toMatchObject({
        id: expect.any(Number) as number,
        name: expect.any(String) as string,
        password: expect.any(String) as string,
        email: expect.any(String) as string,
        picture: '',
      });
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
