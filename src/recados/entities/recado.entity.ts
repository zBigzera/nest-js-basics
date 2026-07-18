import { Pessoa } from 'src/pessoas/entities/pessoa.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Recado {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 255,
  })
  texto!: string;

  @ManyToOne(() => Pessoa, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'de' })
  de!: Pessoa;

  @ManyToOne(() => Pessoa, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'para' })
  para!: Pessoa;

  @Column({
    default: false,
  })
  lido!: boolean;

  @UpdateDateColumn()
  updatedAt?: Date;

  @CreateDateColumn()
  createdAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
