import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";
import { BaseUserDto } from "./base-user.dto";
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDto extends PartialType(BaseUserDto) {
  @IsOptional()
  @IsString()
  reset_token?: string | null;

  @IsOptional()
  @IsString()
  reset_token_expiry?: Date | null;

  @IsOptional()
  @IsString()
  refresh_token?: string | null;

  @IsOptional()
  @IsString()
  profilePicture?: string | null;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  idCardFront?: string | null;
  @IsOptional()
  @IsString()
  idCardBack?: string | null;
  @IsEmail()
  @IsOptional()
  newEmail?: string | null;
}