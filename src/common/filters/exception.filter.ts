import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/**
 * 전역 예외 필터로, 발생한 예외를 처리하여 표준 오류 응답 형식으로 변환합니다.
 * @class HttpExceptionFilter
 * @implements {ExceptionFilter}
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * 예외를 처리하여 HTTP 응답을 반환합니다.
   * @param {unknown} exception - 발생한 예외 객체
   * @param {ArgumentsHost} host - 현재 실행 컨텍스트
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 기본 오류 메시지와 오류 코드 설정
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    // 예외가 HttpException인 경우 메시지와 코드 업데이트
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      // 예외 응답이 문자열인 경우 메시지 설정
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        code = responseObj.error || code;
      }
    }

    // 오류 응답 반환
    response.status(status).json({
      status: 'error',
      error: {
        code,
        message,
      },
    });
  }
}
