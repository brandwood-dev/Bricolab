import { Country, Prefix, UserType } from "@prisma/client";
import { Exclude } from "class-transformer";

export class UserResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: number;
    country: Country;
    prefix: Prefix;
    type: UserType;
    profilePicture: string | null;
    @Exclude()
    verified_email: boolean;
    createdAt: Date;
    @Exclude()
    updatedAt: Date;
    role: string;
    @Exclude()
    refresh_token?: string | null;
    @Exclude()
    reset_token?: string | null;
    @Exclude()
    reset_token_expiry?: Date | null;
    @Exclude()
    verify_token?: string | null;
    @Exclude()
    password: string;
    isVerified: boolean;
    @Exclude()
    isActive: boolean;
    
}