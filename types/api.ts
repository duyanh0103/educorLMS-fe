export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: ApiFieldError[];
}

export class ApiRequestError extends Error {
  status: number;
  fieldErrors?: ApiFieldError[];

  constructor(status: number, message: string, fieldErrors?: ApiFieldError[]) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
