export type ValidationFields = Record<string, string[]>;

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly fields?: ValidationFields,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class RequestValidationError extends AppError {
  constructor(fields: ValidationFields) {
    super(400, "VALIDATION_ERROR", "Request validation failed.", fields);
  }
}

export class EmailAlreadyRegisteredError extends AppError {
  constructor() {
    super(409, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
}

export class EmailVerificationRequiredError extends AppError {
  constructor() {
    super(403, "EMAIL_VERIFICATION_REQUIRED", "Verify your email address before signing in.");
  }
}

export class InvalidVerificationTokenError extends AppError {
  constructor() {
    super(400, "INVALID_OR_EXPIRED_VERIFICATION_TOKEN", "This verification link is invalid or has expired.");
  }
}

export class AuthenticationRequiredError extends AppError {
  constructor(message = "Authentication is required.") {
    super(401, "AUTHENTICATION_REQUIRED", message);
  }
}

export class RefreshAlreadyRotatedError extends AppError {
  constructor() {
    super(409, "REFRESH_ALREADY_ROTATED", "The session was refreshed by another request.");
  }
}

export class CsrfValidationError extends AppError {
  constructor() {
    super(403, "CSRF_VALIDATION_FAILED", "The request origin is not allowed.");
  }
}
