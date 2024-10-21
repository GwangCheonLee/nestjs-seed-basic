import {IsEmail, IsString} from 'class-validator';

/**
 * 회원가입 요청에 사용되는 DTO입니다.
 */
export class SignUpRequestBodyDto {
  @IsString()
  nickname: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
