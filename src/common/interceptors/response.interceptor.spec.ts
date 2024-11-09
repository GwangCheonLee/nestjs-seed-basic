import {Test, TestingModule} from '@nestjs/testing';
import {CallHandler, ExecutionContext} from '@nestjs/common';
import {ResponseInterceptor} from './response.interceptor';
import {firstValueFrom, of} from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseInterceptor],
    }).compile();

    interceptor = module.get<ResponseInterceptor<any>>(ResponseInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should transform the response to a standard success format', async () => {
    const mockExecutionContext: Partial<ExecutionContext> = {
      switchToHttp: jest.fn(),
    };

    const mockCallHandler: Partial<CallHandler<any>> = {
      handle: jest.fn(() => of({message: 'Test response'})),
    };

    const result = await firstValueFrom(
      interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler<any>,
      ),
    );

    expect(result).toEqual({
      status: 'success',
      data: {message: 'Test response'},
    });
  });

  it('should transform an empty response correctly', async () => {
    const mockExecutionContext: Partial<ExecutionContext> = {
      switchToHttp: jest.fn(),
    };

    const mockCallHandler: Partial<CallHandler<any>> = {
      handle: jest.fn(() => of(null)),
    };

    const result = await firstValueFrom(
      interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler<any>,
      ),
    );

    expect(result).toEqual({
      status: 'success',
      data: null,
    });
  });
});
