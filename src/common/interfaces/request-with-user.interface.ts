import {Request} from 'express';
import {User} from '../../users/entities/user.entity';

/**
 * 사용자 정보를 포함하는 Request 객체입니다.
 */
interface RequestWithUser extends Request {
  user: User;
}

export default RequestWithUser;
