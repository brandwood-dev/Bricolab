import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateAppReviewDto {
    @IsNotEmpty()
    @IsString()
    comment: string;
    
    @IsNotEmpty()
    @IsNumber()
    rating: number;

    @IsOptional()
    @IsString()
    userId?: string;
}