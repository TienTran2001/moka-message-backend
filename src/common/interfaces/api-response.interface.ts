/**
 * Standard API success response
 * Tất cả API trả về thành công đều follow format này
 *
 * @example
 * {
 *   "success": true,
 *   "data": { ... }
 * }
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Standard API error response
 *
 * @example
 * {
 *   "success": false,
 *   "message": "Error message",
 *   "errors": { ... }     // optional, chỉ có khi validation failed
 * }
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, unknown>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Standard paginated response data
 *
 * @example
 * {
 *   "success": true,
 *   "data": {
 *     "items": [...],
 *     "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
 *   }
 * }
 */
export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}
