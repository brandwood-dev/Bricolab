import { BadRequestException } from "@nestjs/common";

export class EmailAlreadyExistsException extends BadRequestException {
  constructor() {
    super('Email already registered');
  }
}

export class EmailAlreadyVerifiedException extends BadRequestException {
  constructor() {
    super('Email already verified');
  }
}

export class InvalidCredentialsException extends BadRequestException {
  constructor() {
    super('Invalid email or password');
  }
}

export class EmailNotVerifiedException extends BadRequestException {
  constructor() {
    super('Email not verified. Please verify your email before logging in.');
  }
}

export class InvalidTokenException extends BadRequestException {
  constructor() {
    super(`Invalid  token`);
  }
}

export class TokenExpiredException extends BadRequestException {
  constructor() {
    super('Token has expired');
  }
}

export class WeakPasswordException extends BadRequestException {
  constructor() {
    super('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character');
  }
}

export class UserNotActiveException extends BadRequestException {
  constructor() {
    super('User account is not active');
  }
}