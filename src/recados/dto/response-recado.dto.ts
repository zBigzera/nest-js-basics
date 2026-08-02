export class ResponseRecadoDto {
  id: number;
  texto: string;
  lido: boolean;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
  de: {
    id: number;
    name: string;
  };
  para: {
    id: number;
    name: string;
  };
}
