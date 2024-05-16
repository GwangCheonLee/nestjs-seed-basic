import { IsEmail, IsString } from 'class-validator';

export class SignUpDto {
  @IsString()
  nickname: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
