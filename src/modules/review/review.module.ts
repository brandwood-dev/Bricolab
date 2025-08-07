import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewRepository } from './review.repository';

@Module({
  providers: [ReviewService, ReviewRepository],
  controllers: [ReviewController]
})
export class ReviewModule {}
