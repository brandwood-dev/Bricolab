import { IsString, IsArray, IsOptional, IsEnum, MinLength } from 'class-validator';

export enum ModerationActionType {
  APPROUVER = 'APPROUVER',
  REJETER = 'REJETER',
  SUPPRIMER = 'SUPPRIMER'
}

export class ModerateToolDto {
  @IsEnum(ModerationActionType)
  action: ModerationActionType;

  @IsArray()
  @IsString({ each: true })
  reasons: string[];

  @IsString()
  @IsOptional()
  comment?: string;
}

export class RejectionReason {
  static readonly PHOTOS_QUALITY = 'Photos de mauvaise qualité ou manquantes';
  static readonly DESCRIPTION_INSUFFICIENT = 'Description insuffisante ou incomplète';
  static readonly PRICE_ABNORMAL = 'Prix anormalement élevé ou bas';
  static readonly INAPPROPRIATE_CATEGORY = 'Catégorie inappropriée';
  static readonly INAPPROPRIATE_CONTENT = 'Contenu inapproprié ou non conforme';
  static readonly DUPLICATE_DETECTED = 'Doublon détecté';
  static readonly MISSING_CONTACT = 'Informations de contact manquantes';
  static readonly MISSING_AVAILABILITY = 'Disponibilités non précisées';
  static readonly OTHER = 'Autre motif';
}

export class DeletionReason {
  static readonly INAPPROPRIATE_CONTENT = 'Contenu inapproprié ou offensant';
  static readonly VIOLATION_TERMS = 'Violation des conditions d\'utilisation';
  static readonly FRAUDULENT = 'Annonce frauduleuse ou trompeuse';
  static readonly ILLEGAL_PRODUCT = 'Produit/service illégal';
  static readonly SPAM = 'Spam ou contenu publicitaire abusif';
  static readonly MULTIPLE_REPORTS = 'Signalements multiples d\'utilisateurs';
  static readonly CONFIRMED_DUPLICATE = 'Doublon confirmé';
  static readonly WRONG_CONTACT = 'Informations de contact erronées';
  static readonly EXPIRED_NOT_UPDATED = 'Annonce expirée non mise à jour';
  static readonly OTHER = 'Autre motif';
} 