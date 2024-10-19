import {Controller} from '@nestjs/common';
import {UserService} from './user.service';

/**
 * 사용자 관련 요청을 처리하는 컨트롤러입니다.
 * @class UserController
 */
@Controller({version: '1', path: 'users'})
export class UserController {
  /**
   * @param {UserService} userService - 사용자 관련 비즈니스 로직을 처리하는 서비스
   */
  constructor(private readonly userService: UserService) {}
}
