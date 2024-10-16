import {Controller, Get} from '@nestjs/common';
import {AppService} from './app.service';

/**
 * 애플리케이션의 컨트롤러로, 헬스 체크 및 핑 API를 제공합니다.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 애플리케이션의 헬스 체크 엔드포인트입니다.
   * @return {string} 애플리케이션의 상태 문자열
   */
  @Get()
  getHealth(): string {
    return this.appService.getHealth();
  }

  /**
   * 핑 엔드포인트로, pong 문자열을 반환합니다.
   * @return {string} 'pong' 문자열
   */
  @Get('ping')
  ping(): string {
    return this.appService.ping();
  }
}
