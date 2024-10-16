import {Injectable} from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * 애플리케이션의 헬스 체크 엔드포인트입니다.
   * @return {string} 빈 문자열
   */
  getHealth(): string {
    return '';
  }

  /**
   * 핑 엔드포인트로, pong 문자열을 반환합니다.
   * @return {string} 'pong' 문자열
   */
  ping(): string {
    return 'pong';
  }
}
