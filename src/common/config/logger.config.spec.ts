import {LogLevel} from '@nestjs/common';
import {getLogLevels} from './logger.config';

describe('getLogLevels', () => {
  it('should return all log levels for docker environment', () => {
    const result: LogLevel[] = getLogLevels('docker');
    expect(result).toEqual(['log', 'error', 'warn', 'debug', 'verbose']);
  });

  it('should return all log levels for local environment', () => {
    const result: LogLevel[] = getLogLevels('local');
    expect(result).toEqual(['log', 'error', 'warn', 'debug', 'verbose']);
  });

  it('should return basic log levels for dev environment', () => {
    const result: LogLevel[] = getLogLevels('dev');
    expect(result).toEqual(['log', 'error', 'warn']);
  });

  it('should return minimal log levels for prod environment', () => {
    const result: LogLevel[] = getLogLevels('prod');
    expect(result).toEqual(['error', 'warn']);
  });

  it('should return default log levels for unknown environment', () => {
    const result: LogLevel[] = getLogLevels('unknown');
    expect(result).toEqual(['error', 'warn']);
  });
});
