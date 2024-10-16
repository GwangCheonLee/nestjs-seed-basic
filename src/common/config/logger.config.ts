import {LogLevel} from '@nestjs/common';

/**
 * 환경 변수에 따라 로그 레벨을 반환합니다.
 * @param {string} env 현재 환경 (docker, dev, prod)
 * @return {LogLevel[]} 해당 환경에서 사용할 로그 레벨 배열
 */
export function getLogLevels(env: string): LogLevel[] {
  switch (env) {
    case 'docker':
    case 'local': // local 환경에서는 모든 로그 출력
      return ['log', 'error', 'warn', 'debug', 'verbose'];
    case 'dev': // dev 환경에서는 일반 로그까지 출력
      return ['log', 'error', 'warn'];
    case 'prod': // 프로덕션에서는 에러와 경고만 출력
      return ['error', 'warn'];
    default: // 기본적으로 에러와 경고만 출력
      return ['error', 'warn'];
  }
}
