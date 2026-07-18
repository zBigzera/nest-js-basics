import { IsEmail } from 'class-validator';
import { Recado } from 'src/recados/entities/recado.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Pessoa {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    unique: true,
  })
  @IsEmail()
  email!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 255 })
  password!: string;

  @OneToMany(() => Recado, (recado) => recado.de)
  recadosEnviados!: Recado[];

  @OneToMany(() => Recado, (recado) => recado.para)
  recadosRecebidos!: Recado[];

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
