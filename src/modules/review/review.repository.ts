import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAppReviewDto } from "./dto/create_app_review.dto";


@Injectable()
export class ReviewRepository {
    private readonly logger = new Logger(ReviewRepository.name);
    constructor(
        private readonly prisma : PrismaService,
    ) {}
    
    async createAppReview(CreateAppReview: CreateAppReviewDto) {
        this.logger.log("Creating a new App review");
        return await this.prisma.appRating.create({
            data: {
                comment: CreateAppReview.comment,
                rating: CreateAppReview.rating,
                userId: CreateAppReview.userId!,
            },
        });
    }

    async updateAppReview(id: string, updateReviewDto: CreateAppReviewDto) {
        this.logger.log(`Updating an App review with id: ${id}`);
        return await this.prisma.appRating.update({
            where: { id },
            data: {
                comment: updateReviewDto.comment,
                rating: updateReviewDto.rating,
            },
        });
    }

    async deleteAppReview(id: string, userId: string) {
        this.logger.log(`Deleting an App review with id: ${id}`);
        return await this.prisma.appRating.delete({
            where: { id, userId },
        });
    }
    async deleteAppReviewAdmin(id: string) {
        this.logger.log(`Admin deleting an App review with id: ${id}`);
        return await this.prisma.appRating.delete({
            where: { id },
        });
    }

    async getAppReviews() {
        this.logger.log("Fetching all App reviews");
        return await this.prisma.appRating.findMany({
            include: { user: true }, 
        });
    }

    async getAppReviewById(id: string) {
        this.logger.log(`Fetching App review with id: ${id}`);
        return await this.prisma.appRating.findUnique({
            where: { id },
            include: { user: true }, 
        });
    }

    async getAverageAppRating() {
        this.logger.log("Fetching average rating for all App reviews");
        const result = await this.prisma.appRating.aggregate({
            _avg: {
                rating: true,
            },
        });
        return result._avg.rating;
    }

    
}