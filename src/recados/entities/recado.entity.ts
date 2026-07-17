import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
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

  @Column({
    type: 'varchar',
    length: 50,
  })
  de!: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  para!: string;

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
