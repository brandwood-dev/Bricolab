import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @Length(6, 6, { message: 'Token must be exactly 6 characters' })
  token: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}