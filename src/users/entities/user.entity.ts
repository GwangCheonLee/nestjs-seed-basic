import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {IsEmail} from 'class-validator';
import {UserRole} from '../enum/user-role.enum';

/**
 * User Entity
 */
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

  @Column({
    type: 'enum',
    enum: UserRole,
    default: [UserRole.USER],
    array: true,
  })
  roles: UserRole[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
