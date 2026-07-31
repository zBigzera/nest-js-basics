import { validate } from 'class-validator';
import { CreatePessoaDto } from './create-pessoa.dto';

describe('Testando DTO de criação de pessoa', () => {
  it('Deve retornar um DTO válido', async () => {
    const dto = new CreatePessoaDto();
    dto.name = 'Robertin';
    dto.email = 'emailvalido@teste.com';
    dto.password = '123456';
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('Deve falhar com e-mail inválido', async () => {
    const dto = new CreatePessoaDto();
    dto.name = 'Robertin';
    dto.email = 'emailinvalido';
    dto.password = '123456';
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });
});
