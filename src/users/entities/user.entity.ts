import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {IsEmail} from 'class-validator';
import {UserRole} from '../enum/user-role.enum';
import {Exclude} from 'class-transformer';

/**
 * User Entity
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({name: 'oauth_provider', nullable: true})
  oauthProvider?: string | null;

  @Column({name: 'email', unique: true})
  @IsEmail()
  email: string;

  @Exclude()
  @Column({name: 'password', nullable: true})
  password?: string | null;

  @Column({name: 'nickname'})
  nickname: string;

  @Column({name: 'profile_image', nullable: true})
  profileImage?: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: [UserRole.USER],
    array: true,
  })
  roles: UserRole[];

  @Column({name: 'two_factor_authentication_secret', nullable: true})
  twoFactorAuthenticationSecret?: string | null;

  @Column({name: 'is_active', default: true})
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
