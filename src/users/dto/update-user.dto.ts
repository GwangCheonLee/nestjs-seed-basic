import {IsEmail, IsEnum, IsOptional, IsString} from 'class-validator';
import {UserRole} from '../enum/user-role.enum';

/**
 * 유저 업데이트 DTO
 */
export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(UserRole, {each: true})
  @IsOptional()
  roles?: UserRole[];

  @IsString()
  @IsOptional()
  profileImage?: string;
}
