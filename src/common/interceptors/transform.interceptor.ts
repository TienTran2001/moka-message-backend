import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '@common/interfaces/api-response.interface';

/**
 * Global interceptor: wrap tất cả response thành công thành format chuẩn
 *
 * Controller trả về: T
 * API response:      { success: true, data: T }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    // Skip WebSocket — only wrap response for HTTP
    if (context.getType() !== 'http') {
      return next.handle();
    }
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data: data as T,
      })),
    );
  }
}
