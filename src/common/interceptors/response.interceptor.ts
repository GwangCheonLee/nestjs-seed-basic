import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

/**
 * 모든 응답을 표준 성공 응답 형식으로 변환하는 인터셉터입니다.
 * @class ResponseInterceptor
 * @implements {NestInterceptor}
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  /**
   * 요청을 가로채고 응답을 수정합니다.
   * @param {ExecutionContext} context - 현재 실행 컨텍스트
   * @param {CallHandler<T>} next - 다음 핸들러
   * @return {Observable<any>} 수정된 응답 데이터가 포함된 Observable
   */
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return {
          status: 'success',
          data: data,
        };
      }),
    );
  }
}
