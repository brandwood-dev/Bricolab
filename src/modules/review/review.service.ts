import { Injectable, NotFoundException, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { ReviewRepository } from './review.repository';
import { CreateAppReviewDto } from './dto/create_app_review.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReviewService {
    private readonly logger = new Logger(ReviewService.name);
    
    constructor(
        private readonly reviewRepository: ReviewRepository,
    ) {}

    async createAppReview(createAppReviewDto: CreateAppReviewDto) {
        try {
            return await this.reviewRepository.createAppReview(createAppReviewDto);
        } catch (error) {
            this.logger.error('Failed to create app review', {
                dto: createAppReviewDto,
                error: error instanceof Error ? error.message : String(error),
            });

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new BadRequestException('Duplicate review entry');
                }
                if (error.code === 'P2003') {
                    throw new BadRequestException('Invalid user ID or foreign key constraint failed');
                }
            }

            throw new InternalServerErrorException('Could not create review');
        }
    }

    async updateAppReview(id: string, updateReviewDto: CreateAppReviewDto) {
        try {
            const review = await this.reviewRepository.updateAppReview(id, updateReviewDto);
            this.logger.log(`Successfully updated app review with ID: ${id}`);
            return review;
        } catch (error) {
            this.logger.error('Failed to update app review', {
                reviewId: id,
                dto: updateReviewDto,
                error: error instanceof Error ? error.message : String(error),
            });

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException('Review not found');
                }
                if (error.code === 'P2003') {
                    throw new BadRequestException('Invalid data provided');
                }
            }

            throw new InternalServerErrorException('Could not update review');
        }
    }
    async deleteAppReview(id: string, userId: string) {
        try {
            const review = await this.reviewRepository.deleteAppReview(id, userId);
            this.logger.log(`Successfully deleted app review with ID: ${id} for user: ${userId}`);
            return review;
        } catch (error) {
            this.logger.error('Failed to delete app review', {
                reviewId: id,
                userId,
                error: error instanceof Error ? error.message : String(error),
            });

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException('Review not found');
                }
            }

            throw new InternalServerErrorException('Could not delete review');
        }
    }

    async deleteAppReviewAdmin(id: string) {
        try {
            const review = await this.reviewRepository.deleteAppReviewAdmin(id);
            this.logger.log(`Admin successfully deleted app review with ID: ${id}`);
            return review;
        } catch (error) {
            this.logger.error('Failed to delete app review (admin)', {
                reviewId: id,
                error: error instanceof Error ? error.message : String(error),
            });

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException('Review not found');
                }
            }

            throw new InternalServerErrorException('Could not delete review');
        }
    }
    async getAppReviews() {
        try {
            const reviews = await this.reviewRepository.getAppReviews();
            return reviews.map(review => ({
                ...review,
                user: {
                    profilePicture: review.user.profilePicture,
                    firstName: review.user.firstName,
                    lastName: review.user.lastName,
                }
            }));
        } catch (error) {
            this.logger.error('Failed to get app reviews', {
                error: error instanceof Error ? error.message : String(error),
            });

            throw new InternalServerErrorException('Could not retrieve reviews');
        }
    }

    async getAppReviewById(id: string) {
        try {
            const review = await this.reviewRepository.getAppReviewById(id);
            if (!review) {
                throw new NotFoundException('Review not found');
            }

            return {
                ...review,
                user: {
                    profilePicture: review.user.profilePicture,
                    firstName: review.user.firstName,
                    lastName: review.user.lastName,
                }
            };
        } catch (error) {
            this.logger.error('Failed to get app review by ID', {
                reviewId: id,
                error: error instanceof Error ? error.message : String(error),
            });

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Could not retrieve review');
        }
    }

    async getAverageAppRating() {
        try {
            return await this.reviewRepository.getAverageAppRating();
        } catch (error) {
            this.logger.error('Failed to get average app rating', {
                error: error instanceof Error ? error.message : String(error),
            });

            throw new InternalServerErrorException('Could not retrieve average rating');
        }
    }
    

}
