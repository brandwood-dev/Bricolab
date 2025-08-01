import { IsString, IsNotEmpty, IsArray, IsEnum, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SectionType {
  Title = 'title',
  Paragraph = 'paragraph',
  Image = 'image',
  Video = 'video',
  Subtitle = 'subtitle',
}

export enum BlogCategory {
  Jardinage = 'Jardinage',
  Entretient = 'Entretient',
  Transport = 'Transport',
  Bricolage = 'Bricolage',
  Électricité = 'Électricité',
  Éclairage = 'Éclairage',
  Peinture = 'Peinture',
  Consctruction = 'Consctruction',
  Plantes = 'Plantes',
  Nettoyage = 'Nettoyage',
  Décoration = 'Décoration',
}

export class SectionDto {
  @IsEnum(SectionType)
  type: SectionType;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsInt()
  @Min(1)
  lectureTime: number;

  @IsEnum(BlogCategory)
  category: BlogCategory;

  @IsString()
  coverImageUrl: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
  
}