export interface ApiErrorResponse {
  success: boolean;
  status: number;
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
  errorId?: string;
  validationErrors?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
