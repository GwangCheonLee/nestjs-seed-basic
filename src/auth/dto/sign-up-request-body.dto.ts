import {IsEmail, IsString} from 'class-validator';

export class SignUpRequestBodyDto {
  @IsString()
  nickname: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
