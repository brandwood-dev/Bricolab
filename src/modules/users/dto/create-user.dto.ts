import { Country, Prefix, User, UserType } from "@prisma/client";
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsNotEmpty()
    @IsEnum(UserType)
    type: UserType;

    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsEnum(Country)
    country: Country;

    @IsNotEmpty()
    @IsEnum(Prefix)
    prefix: Prefix;

    @IsNotEmpty()
    @IsNumber()
    phoneNumber: number;

    @IsString()
    @IsOptional()
    verify_token?: string | null;

    @IsBoolean()
    @IsOptional()
    verified_email?: boolean = false;

    @IsString()
    @IsOptional()
    reset_token?: string | null;
    
    @IsOptional()
    reset_token_expiry?: Date | null;

    @IsOptional()
    refresh_token?: string | null;
}