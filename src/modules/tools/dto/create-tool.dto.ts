import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsBoolean, Min, Max, IsNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ToolCondition } from '@prisma/client';

// Temporary enum definitions until Prisma client is generated
export enum ToolCategory {
  JARDINAGE = 'JARDINAGE',
  BRICOLAGE = 'BRICOLAGE',
  TRANSPORT = 'TRANSPORT',
  NETTOYAGE = 'NETTOYAGE',
  EVENEMENTIEL = 'EVENEMENTIEL'
}

export enum ToolStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  PUBLIE = 'PUBLIE',
  REJETE = 'REJETE',
  SUSPENDU = 'SUSPENDU'
}

export enum AvailabilityStatus {
  DISPONIBLE = 'DISPONIBLE',
  RESERVE = 'RESERVE',
  SUSPENDU = 'SUSPENDU',
  EN_ATTENTE = 'EN_ATTENTE'
}

export class CreateToolDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @IsOptional()
  @Min(1900)
  @Max(2025)
  @Type(() => Number)
  @Transform(({ value }) => value ? Number(value) : undefined)
  year?: number;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @IsString()
  @IsOptional()
  ownerInstructions?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @Transform(({ value }) => Number(value))
  basePrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @Transform(({ value }) => Number(value))
  depositAmount: number;

  @IsEnum(ToolCategory)
  category: ToolCategory;

  @IsString()
  @IsNotEmpty()
  subcategoryId: string;

  @IsArray()
  @IsOptional()
  availabilityDates?: Date[];

  @IsArray()
  @IsOptional()
  photos?: Express.Multer.File[];

  @IsEnum(ToolCondition)
  condition: ToolCondition;
}

export class ToolPricingDto {
  @IsNumber()
  @Min(1)
  duration: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discount: number;
}

export class ToolAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsBoolean()
  isAvailable: boolean;
} 