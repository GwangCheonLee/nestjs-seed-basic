import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {IsEmail} from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({name: 'email', unique: true})
  @IsEmail()
  email: string;

  @Column({name: 'password'})
  password: string;

  @Column({name: 'nickname'})
  nickname: string;

  @Column({nullable: true})
  currentAccessToken: string | null;

  @Column({nullable: true})
  currentRefreshToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
