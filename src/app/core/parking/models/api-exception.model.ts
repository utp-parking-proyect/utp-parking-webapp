export interface ApiExceptionDetail {
  component?: string;
  description?: string;
}

export interface ApiException {
  description?: string;
  errorType?: string;
  exceptionDetails?: ApiExceptionDetail[];
}
