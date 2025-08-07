import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Logger,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { CreateToolDto, ToolCategory } from './dto/create-tool.dto';
import { ModerateToolDto } from './dto/moderate-tool.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AdminGuard, JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';
// Temporary types until Prisma client is generated
type Role = 'USER' | 'ADMIN';
type User = {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
};

// Simple auth guard for now
class SimpleAuthGuard {
  canActivate() {
    return true;
  }
}

// Simple roles guard for now
class SimpleRolesGuard {
  canActivate() {
    return true;
  }
}

// Simple decorators for now
const Roles = (...roles: string[]) => () => { };
const GetUser = () => (target: any, propertyKey: string, parameterIndex: number) => { };

const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpg, .jpeg, .png, .webp image files are allowed!'), false);
  }
};

@ApiTags('tools')
@Controller('tools')
export class ToolsController {
  private readonly logger = new Logger(ToolsController.name);

  constructor(private readonly toolsService: ToolsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('photos', 10, {
    storage: diskStorage({
      destination: './uploads/tools',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: imageFileFilter,
  }))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tool listing' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Tool created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: User,
    @Body() createToolDto: CreateToolDto,
    @UploadedFiles() photos: Express.Multer.File[],
    @Req() req?: any,
  ) {
    this.logger.log(`Creating tool for user ID: ${user.id}`);
    this.logger.log(`Request headers: ${JSON.stringify(req?.headers)}`);
    this.logger.log(`User from request: ${JSON.stringify(req?.user)}`);
    this.logger.log(`Tool data: ${JSON.stringify(createToolDto)}`);

    return this.toolsService.create(createToolDto, user.id, photos);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tools with optional filters and pagination' })
  @ApiResponse({ status: 200, description: 'Tools retrieved successfully' })
  async findAll(
    @Query('category') category?: ToolCategory,
    @Query('subcategory') subcategory?: string,
    @Query('status') status?: string,
    @Query('availabilityStatus') availabilityStatus?: string,
    @Query('ownerId') ownerId?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('location') location?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radius') radius?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'recent' | 'price-asc' | 'price-desc' | 'rating' | 'distance',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.toolsService.findAll({
      category,
      subcategory,
      status: status as any,
      availabilityStatus: availabilityStatus as any,
      ownerId,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      location,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 12,
      sortBy,
      sortOrder,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories with subcategories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return this.toolsService.getCategories();
  }

  @Get('categories/:category/subcategories')
  @ApiOperation({ summary: 'Get subcategories for a specific category' })
  @ApiResponse({ status: 200, description: 'Subcategories retrieved successfully' })
  async getSubcategories(@Param('category') category: ToolCategory) {
    return this.toolsService.getSubcategories(category);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tool statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getStatistics() {
    return this.toolsService.getToolStatistics();
  }

  @Get('price-statistics')
  @ApiOperation({ summary: 'Get price statistics for filtering' })
  @ApiResponse({ status: 200, description: 'Price statistics retrieved successfully' })
  async getPriceStatistics() {
    return this.toolsService.getPriceStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific tool by ID' })
  @ApiResponse({ status: 200, description: 'Tool retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tool not found' })
  async findOne(@Param('id') id: string) {
    return this.toolsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('photos', 10, {
    storage: diskStorage({
      destination: './uploads/tools',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: imageFileFilter,
  }))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tool listing' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Tool updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner access required' })
  @ApiResponse({ status: 404, description: 'Tool not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateToolDto: any, // Using any for now
    @UploadedFiles() photos: Express.Multer.File[],
  ) {
    return this.toolsService.update(id, updateToolDto, user.id, photos);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tool listing' })
  @ApiResponse({ status: 200, description: 'Tool deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Active reservations exist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner access required' })
  @ApiResponse({ status: 404, description: 'Tool not found' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.toolsService.remove(id, userId);
  }

  // Review endpoints
  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get reviews for a tool' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tool not found' })
  async getToolReviews(
    @Param('id') toolId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.toolsService.getToolReviews(
      toolId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id/reviews/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user has reviewed this tool' })
  @ApiResponse({ status: 200, description: 'Check result retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tool not found' })
  async checkUserReview(
    @Param('id') toolId: string,
    @CurrentUser() user: User,
  ) {
    const hasReviewed = await this.toolsService.hasUserReviewedTool(toolId, user.id);
    return { hasReviewed };
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a tool' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tool not found' })
  async createToolReview(
    @Param('id') toolId: string,
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.toolsService.createToolReview(toolId, createReviewDto, user.id);
  }

  @Patch(':toolId/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review for a tool' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async updateToolReview(
    @Param('toolId') toolId: string,
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.toolsService.updateToolReview(reviewId, updateReviewDto, user.id);
  }

  @Delete(':toolId/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review for a tool' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteToolReview(
    @Param('toolId') toolId: string,
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: User,
  ) {
    return this.toolsService.deleteToolReview(reviewId, user.id);
  }

  // Admin/Moderation endpoints
  @Post(':id/moderate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moderate a tool (Approve/Reject/Delete) - Admin only' })
  @ApiResponse({ status: 200, description: 'Tool moderated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Tool not found' })
  async moderate(
    @Param('id') id: string,
    @Body() moderateToolDto: ModerateToolDto,
    @CurrentUser() user: User,
  ) {
    return this.toolsService.moderate(id, moderateToolDto, user);
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending tools for moderation - Admin only' })
  @ApiResponse({ status: 200, description: 'Pending tools retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getPendingTools() {
    return this.toolsService.findAll({ status: 'EN_ATTENTE' as any });
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tools for admin (including pending ones)' })
  @ApiResponse({ status: 200, description: 'Tools retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllToolsForAdmin(
    @Query('category') category?: ToolCategory,
    @Query('subcategory') subcategory?: string,
    @Query('status') status?: string,
    @Query('availabilityStatus') availabilityStatus?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('location') location?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radius') radius?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'recent' | 'price-asc' | 'price-desc' | 'rating' | 'distance',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const filters = {
      category: category as ToolCategory,
      subcategory,
      status: status as any, // Allow any status for admin
      availabilityStatus: availabilityStatus as any,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      location,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      sortBy,
      sortOrder,
    };

    return this.toolsService.findAllForAdmin(filters);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAdminStats() {
    return this.toolsService.getAdminStats();
  }
}
