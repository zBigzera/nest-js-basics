export class RecadoEntity {
  constructor(
    public readonly id: number | null,
    public texto: string,
    public de: string,
    public para: string,
    public lido: boolean,
    public data: Date,
  ) {}
}
