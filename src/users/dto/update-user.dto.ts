import {IsOptional, IsString} from 'class-validator';

/**
 * 유저 업데이트 DTO
 */
export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
