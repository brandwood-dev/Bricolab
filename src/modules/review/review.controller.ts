import { Body, Controller, Post, Patch, Param, Delete, Get, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AdminGuard, JwtAuthGuard } from 'src/common/guards';
import { CreateAppReviewDto } from './dto/create_app_review.dto';

@Controller('review')
export class ReviewController {
    constructor(
        private readonly reviewService: ReviewService,
    ) {}

    @Post('app')
    @UseGuards(JwtAuthGuard)
    async createAppReview(@Body() createAppReviewDto: CreateAppReviewDto, @CurrentUser("id") userId: string) {
        createAppReviewDto.userId = userId; 
        return await this.reviewService.createAppReview(createAppReviewDto);
    }
    @Patch('app/:id')
    @UseGuards(JwtAuthGuard)
    async updateAppReview(@Param('id') id: string, @Body() updateReviewDto: CreateAppReviewDto, @CurrentUser("id") userId: string) {
        updateReviewDto.userId = userId;
        return await this.reviewService.updateAppReview(id, updateReviewDto);
    }

    @Delete('admin/app/:id')
    @UseGuards(JwtAuthGuard,AdminGuard)
    async deleteAppReviewAdmin(@Param('id') id: string) {
        return await this.reviewService.deleteAppReviewAdmin(id);
    }

    @Delete('app/:id')
    @UseGuards(JwtAuthGuard)
    async deleteAppReview(@Param('id') id: string, @CurrentUser("id") userId: string) {
        return await this.reviewService.deleteAppReview(id, userId);
    }
    
    @Get('app')
    async getAppReviews() {
        return await this.reviewService.getAppReviews();
    }
    @Get('app/average')
    async getAverageAppRating() {
        return await this.reviewService.getAverageAppRating();
    }
    @Get('app/:id')
    async getAppReviewById(@Param('id') id: string) {
        return await this.reviewService.getAppReviewById(id);
    }
    

}

