import {LogLevel} from '@nestjs/common';

/**
 * 환경 변수에 따라 로그 레벨을 반환합니다.
 * @param {string} env 현재 환경 (docker, dev, prod)
 * @return {LogLevel[]} 해당 환경에서 사용할 로그 레벨 배열
 */
export function getLogLevels(env: string): LogLevel[] {
  switch (env) {
    case 'docker':
    case 'local':
      return ['log', 'error', 'warn', 'debug', 'verbose'];
    case 'dev':
      return ['log', 'error', 'warn'];
    case 'prod':
      return ['error', 'warn'];
    default:
      return ['error', 'warn'];
  }
}
