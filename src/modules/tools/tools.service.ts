import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto, ToolCategory, ToolStatus, AvailabilityStatus } from './dto/create-tool.dto';
import { ModerateToolDto, ModerationActionType, RejectionReason, DeletionReason } from './dto/moderate-tool.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { MailerService } from '../mailer/mailer.service';
import { UpdateToolDto } from './dto/update-tool.dto';
import { ToolCondition } from '@prisma/client';

// Temporary User type until Prisma client is generated
type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

// Haversine formula to calculate distance between two points (in km)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  function toRad(x: number) {
    return (x * Math.PI) / 180;
  }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class ToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async create(createToolDto: CreateToolDto, ownerId: string, photos?: Express.Multer.File[]) {
    const { category, subcategoryId, availabilityDates, photos: dtoPhotos, condition, ...toolData } = createToolDto;
    
    // Convert category to uppercase enum value
    const categoryEnum = category?.toUpperCase() as ToolCategory;
    
    console.log(ownerId,"userId");
    console.log('Looking for subcategory:', { name: subcategoryId, category: categoryEnum });
    const allSubcategories = await this.prisma.subcategory.findMany({
      where: {
        category: {
          name: categoryEnum
        }
      }
    });
    console.log('All subcategories for category', categoryEnum, ':', allSubcategories);
    // Verify subcategory exists and belongs to the category
    const subcategory = await this.prisma.subcategory.findFirst({
      where: {
        name: subcategoryId,
        category: {
          name: categoryEnum
        }
      }
    });
    console.log('Subcategory found:', subcategory);

    if (!subcategory) {
      throw new BadRequestException('Invalid subcategory for the selected category');
    }

    // Map frontend condition values to backend enum
    function mapCondition(condition: string): ToolCondition {
      if (condition === 'EXCELLENT') return 'TRES_BON';
      return condition as ToolCondition;
    }

    // Create the tool with initial status (photos removed from data)
    const tool = await this.prisma.tool.create({
      data: {
        ...toolData,
        condition: mapCondition(condition!),
        category: {
          connect: {
            name: categoryEnum
          }
        },
        subcategory: {
          connect: {
            id: subcategory.id
          }
        },
        owner: {
          connect: {
            id: ownerId
          }
        },
        publicationStatus: ToolStatus.EN_ATTENTE,
        availabilityStatus: AvailabilityStatus.EN_ATTENTE,
      },
      include: {
        category: true,
        subcategory: true,
        owner: true,
      }
    });

    // Handle photos if provided
    if (photos && photos.length > 0) {
      await this.handleToolPhotos(tool.id, photos);
    }

    // Create pricing tiers
    await this.createPricingTiers(tool.id, toolData.basePrice);

    // Handle availability dates if provided
    if (availabilityDates && availabilityDates.length > 0) {
      await this.handleToolAvailability(tool.id, availabilityDates);
    }

    return this.findOne(tool.id);
  }

  async findAll(filters?: {
    category?: ToolCategory;
    subcategory?: string;
    status?: ToolStatus;
    availabilityStatus?: AvailabilityStatus;
    ownerId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    page?: number;
    limit?: number;
    sortBy?: 'recent' | 'price-asc' | 'price-desc' | 'rating' | 'distance';
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: any = {};

    // Handle status filtering
    if (filters?.status) {
      where.publicationStatus = filters.status;
    } else if (filters?.ownerId) {
      // If ownerId is provided (user viewing their own tools), show all tools regardless of status
      // This allows users to see their pending, rejected, and published tools
    } else {
      // For public searches, only show published tools
      where.publicationStatus = ToolStatus.PUBLIE;
    }
    
    if (filters?.category) {
      // Handle both uppercase and lowercase category names
      const categoryName = filters.category.toUpperCase();
      where.category = { name: categoryName };
    }
    
    if (filters?.subcategory) {
      where.subcategory = { name: filters.subcategory };
    }
    
    if (filters?.availabilityStatus) {
      where.availabilityStatus = filters.availabilityStatus;
    }
    
    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }
    
    // Enhanced search across multiple fields
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
        { pickupAddress: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    // Price filtering - start from 0 if minPrice is not provided
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.basePrice = {};
      if (filters?.minPrice !== undefined && filters.minPrice > 0) {
        where.basePrice.gte = filters.minPrice;
      }
      if (filters?.maxPrice !== undefined) {
        where.basePrice.lte = filters.maxPrice;
      }
    }
    
    // Enhanced location filtering
    if (filters?.location) {
      where.OR = [
        { pickupAddress: { contains: filters.location, mode: 'insensitive' } },
        { pickupAddress: { contains: filters.location.replace(/\s+/g, ''), mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const skip = (page - 1) * limit;

    // Determine sorting
    let orderBy: any = { createdAt: 'desc' }; // Default sorting
    
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'recent':
          orderBy = { createdAt: 'desc' };
          break;
        case 'price-asc':
          orderBy = { basePrice: 'asc' };
          break;
        case 'price-desc':
          orderBy = { basePrice: 'desc' };
          break;
        case 'rating':
          // For rating sorting, we'll need to handle this differently
          // as it requires joining with reviews
          orderBy = { createdAt: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
    }

    // Geo-search: filter by distance if latitude, longitude, and radius are provided
    let geoFilter: { latitude: number; longitude: number; radius: number } | null = null;
    if (
      filters?.latitude !== undefined &&
      filters?.longitude !== undefined &&
      filters?.radius !== undefined
    ) {
      geoFilter = {
        latitude: filters.latitude,
        longitude: filters.longitude,
        radius: filters.radius,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.tool.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          subcategory: true,
          owner: true,
          photos: true,
          pricing: true,
          _count: { select: { reservations: true, reviews: true } },
        },
        orderBy,
      }),
      this.prisma.tool.count({ where }),
    ]);

    // If geoFilter is set, filter tools by distance using Haversine formula
    let filteredData = data as typeof data;
    if (geoFilter) {
      const { latitude, longitude, radius } = geoFilter;
      filteredData = data.filter((tool) => {
        if (tool.latitude == null || tool.longitude == null) return false;
        const dist = haversine(latitude, longitude, Number(tool.latitude), Number(tool.longitude));
        return dist <= radius;
      });
    }

    // Helper function to calculate total price (base price + fees)
    const calculateTotalPrice = (basePrice: number): number => {
      // Add 5.4% service fee
      const serviceFee = basePrice * 0.054;
      return basePrice + serviceFee;
    };

    // Add review statistics to each tool
    const toolsWithReviewStats = await Promise.all(
      filteredData.map(async (tool) => {
        const reviewStats = await this.getToolReviewStats(tool.id);
        const totalPrice = calculateTotalPrice(tool.basePrice);
        return {
          ...tool,
          reviewStats,
          totalPrice
        };
      })
    );

    // Handle rating-based sorting if requested
    if (filters?.sortBy === 'rating') {
      toolsWithReviewStats.sort((a, b) => {
        const ratingA = a.reviewStats.averageRating || 0;
        const ratingB = b.reviewStats.averageRating || 0;
        return filters.sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      });
    }

    // Handle distance-based sorting if requested
    if (filters?.sortBy === 'distance' && geoFilter) {
      toolsWithReviewStats.sort((a, b) => {
        const distA = haversine(geoFilter.latitude, geoFilter.longitude, Number(a.latitude), Number(a.longitude));
        const distB = haversine(geoFilter.latitude, geoFilter.longitude, Number(b.latitude), Number(b.longitude));
        return filters.sortOrder === 'desc' ? distB - distA : distA - distB;
      });
    }

    return {
      data: toolsWithReviewStats,
      total: geoFilter ? toolsWithReviewStats.length : total,
      page,
      pageSize: limit,
      totalPages: Math.ceil((geoFilter ? toolsWithReviewStats.length : total) / limit),
    };
  }

  async findAllForAdmin(filters?: {
    category?: ToolCategory;
    subcategory?: string;
    status?: ToolStatus;
    availabilityStatus?: AvailabilityStatus;
    ownerId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    page?: number;
    limit?: number;
    sortBy?: 'recent' | 'price-asc' | 'price-desc' | 'rating' | 'distance';
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: any = {};

    // Admin can see all tools regardless of status
    if (filters?.status) {
      where.publicationStatus = filters.status;
    }
    
    if (filters?.category) {
      const categoryName = filters.category.toUpperCase();
      where.category = { name: categoryName };
    }
    
    if (filters?.subcategory) {
      where.subcategory = { name: filters.subcategory };
    }
    
    if (filters?.availabilityStatus) {
      where.availabilityStatus = filters.availabilityStatus;
    }
    
    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }
    
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
        { pickupAddress: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.basePrice = {};
      if (filters?.minPrice !== undefined && filters.minPrice > 0) {
        where.basePrice.gte = filters.minPrice;
      }
      if (filters?.maxPrice !== undefined) {
        where.basePrice.lte = filters.maxPrice;
      }
    }
    
    if (filters?.location) {
      where.OR = [
        { pickupAddress: { contains: filters.location, mode: 'insensitive' } },
        { pickupAddress: { contains: filters.location.replace(/\s+/g, ''), mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    // Determine sorting
    let orderBy: any = { createdAt: 'desc' }; // Default sorting
    
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'recent':
          orderBy = { createdAt: 'desc' };
          break;
        case 'price-asc':
          orderBy = { basePrice: 'asc' };
          break;
        case 'price-desc':
          orderBy = { basePrice: 'desc' };
          break;
        case 'rating':
          orderBy = { createdAt: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
    }

    // Geo-search: filter by distance if latitude, longitude, and radius are provided
    let geoFilter: { latitude: number; longitude: number; radius: number } | null = null;
    if (
      filters?.latitude !== undefined &&
      filters?.longitude !== undefined &&
      filters?.radius !== undefined
    ) {
      geoFilter = {
        latitude: filters.latitude,
        longitude: filters.longitude,
        radius: filters.radius,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.tool.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          subcategory: true,
          owner: true,
          photos: true,
          pricing: true,
          _count: { select: { reservations: true, reviews: true } },
        },
        orderBy,
      }),
      this.prisma.tool.count({ where }),
    ]);

    // If geoFilter is set, filter tools by distance using Haversine formula
    let filteredData = data as typeof data;
    if (geoFilter) {
      const { latitude, longitude, radius } = geoFilter;
      filteredData = data.filter((tool) => {
        if (tool.latitude == null || tool.longitude == null) return false;
        const dist = haversine(latitude, longitude, Number(tool.latitude), Number(tool.longitude));
        return dist <= radius;
      });
    }

    // Helper function to calculate total price (base price + fees)
    const calculateTotalPrice = (basePrice: number): number => {
      // Add 5.4% service fee
      const serviceFee = basePrice * 0.054;
      return basePrice + serviceFee;
    };

    // Add review statistics to each tool
    const toolsWithReviewStats = await Promise.all(
      filteredData.map(async (tool) => {
        const reviewStats = await this.getToolReviewStats(tool.id);
        const totalPrice = calculateTotalPrice(tool.basePrice);
        return {
          ...tool,
          reviewStats,
          totalPrice
        };
      })
    );

    // Handle rating-based sorting if requested
    if (filters?.sortBy === 'rating') {
      toolsWithReviewStats.sort((a, b) => {
        const ratingA = a.reviewStats.averageRating || 0;
        const ratingB = b.reviewStats.averageRating || 0;
        return filters.sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      });
    }

    // Handle distance-based sorting if requested
    if (filters?.sortBy === 'distance' && geoFilter) {
      toolsWithReviewStats.sort((a, b) => {
        const distA = haversine(geoFilter.latitude, geoFilter.longitude, Number(a.latitude), Number(a.longitude));
        const distB = haversine(geoFilter.latitude, geoFilter.longitude, Number(b.latitude), Number(b.longitude));
        return filters.sortOrder === 'desc' ? distB - distA : distA - distB;
      });
    }

    return {
      data: toolsWithReviewStats,
      total: geoFilter ? toolsWithReviewStats.length : total,
      page,
      pageSize: limit,
      totalPages: Math.ceil((geoFilter ? toolsWithReviewStats.length : total) / limit),
    };
  }

  async getAdminStats() {
    const [
      totalUsers,
      totalTools,
      pendingTools,
      approvedTools,
      rejectedTools,
      totalReviews,
      averageRating,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.tool.count(),
      this.prisma.tool.count({ where: { publicationStatus: ToolStatus.EN_ATTENTE } }),
      this.prisma.tool.count({ where: { publicationStatus: ToolStatus.PUBLIE } }),
      this.prisma.tool.count({ where: { publicationStatus: ToolStatus.REJETE } }),
      this.prisma.review.count(),
      this.prisma.review.aggregate({
        _avg: { rating: true },
      }),
    ]);

    // Get monthly stats for the current year
    const currentYear = new Date().getFullYear();
    const monthlyStats = await this.prisma.tool.groupBy({
      by: ['publicationStatus'],
      where: {
        createdAt: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31),
        },
      },
      _count: true,
    });

    return {
      totalUsers,
      totalTools,
      pendingTools,
      approvedTools,
      rejectedTools,
      totalReviews,
      averageRating: averageRating._avg.rating || 0,
      monthlyStats,
    };
  }

  async findOne(id: string) {
    const tool = await this.prisma.tool.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            prefix: true,
          }
        },
        photos: true,
        pricing: true,
        availability: true,
        moderationActions: {
          include: {
            moderator: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        reservations: {
          include: {
            tool: {
              select: {
                title: true,
              }
            }
          }
        },
        _count: {
          select: {
            reservations: true,
            reviews: true,
          }
        }
      }
    });

    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    // Get review statistics
    const reviewStats = await this.getToolReviewStats(id);
    
    // Calculate total price (base price + fees)
    const totalPrice = tool.basePrice + (tool.basePrice * 0.054); // 5.4% service fee
    
    return {
      ...tool,
      reviewStats,
      totalPrice
    };
  }

  // Check if user has already reviewed a tool
  async hasUserReviewedTool(toolId: string, userId: string) {
    const existingReview = await this.prisma.review.findFirst({
      where: {
        toolId,
        reviewerId: userId,
      }
    });

    return !!existingReview;
  }

  // Get review statistics for a tool
  async getToolReviewStats(toolId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { toolId },
      select: { rating: true }
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews: reviews.length,
      ratingDistribution
    };
  }

  async update(id: string, updateToolDto: UpdateToolDto, userId: string, photos?: Express.Multer.File[]) {
    const tool = await this.findOne(id);

    // Check if user owns the tool
    if (tool.owner.id !== userId) {
      throw new ForbiddenException('You can only update your own tools');
    }

    // Check if tool has active reservations
    const activeReservations = await this.prisma.reservation.findMany({
      where: {
        toolId: id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        endDate: {
          gte: new Date()
        }
      }
    });

    if (activeReservations.length > 0) {
      throw new BadRequestException('Cannot update tool with active reservations');
    }

    const { category, subcategoryId, availabilityDates, photos: dtoPhotos, condition, ...toolData } = updateToolDto;

    // Convert category string to enum value if needed
    const categoryEnum = category?.toUpperCase() as ToolCategory;

    let subcategoryConnect = {};
    if (subcategoryId) {
      
      const subcategory = await this.prisma.subcategory.findFirst({
        where: {
          name: subcategoryId,
          category: {
            name: categoryEnum
          }
        }
      });
      if (!subcategory) {
        throw new BadRequestException('Invalid subcategory for the selected category');
      }
      subcategoryConnect = {
        subcategory: {
          connect: {
            id: subcategory.id
          }
        }
      };
    }

    // Map frontend condition values to backend enum
    function mapCondition(condition: string): ToolCondition {
      if (condition === 'EXCELLENT') return 'TRES_BON';
      return condition as ToolCondition;
    }

    // Update the tool and reset to pending status for moderation (photos removed from data)
    const updatedTool = await this.prisma.tool.update({
      where: { id },
      data: {
        ...toolData,
        condition: mapCondition(condition!),
        publicationStatus: ToolStatus.EN_ATTENTE,
        moderatedAt: null,
        publishedAt: null,
        ...(category && {
          category: {
            connect: {
              name: categoryEnum
            }
          }
        }),
        ...subcategoryConnect,
      },
      include: {
        category: true,
        subcategory: true,
        owner: true,
      }
    });

    // Handle new photos if provided
    if (photos && photos.length > 0) {
      // Delete old photos
      await this.prisma.toolPhoto.deleteMany({
        where: { toolId: id }
      });
      // Add new photos
      await this.handleToolPhotos(id, photos);
    }

    // Update pricing if base price changed
    if (toolData.basePrice) {
      await this.updatePricingTiers(id, toolData.basePrice);
    }

    // Update availability if provided
    if (availabilityDates) {
      await this.updateToolAvailability(id, availabilityDates);
    }

    return this.findOne(id);
  }

  async remove(id: string, userId: string) {
    const tool = await this.findOne(id);

    // Check if user owns the tool
    if (tool.owner.id !== userId) {
      throw new ForbiddenException('You can only delete your own tools');
    }

    // Check for active reservations
    const activeReservations = await this.prisma.reservation.findMany({
      where: {
        toolId: id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        endDate: {
          gte: new Date()
        }
      }
    });

    if (activeReservations.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer cette annonce car elle contient des réservations en cours ou à venir'
      );
    }

    // Delete the tool (cascade will handle related records)
    await this.prisma.tool.delete({
      where: { id }
    });

    return { message: 'Tool deleted successfully' };
  }

  async moderate(id: string, moderateToolDto: ModerateToolDto, moderator: User) {
    const tool = await this.findOne(id);

    const { action, reasons, comment } = moderateToolDto;

    // Create moderation record
    await this.prisma.moderationActionRecord.create({
      data: {
        action: action as any,
        reasons,
        comment,
        toolId: id,
        moderatorId: moderator.id,
      }
    });

    switch (action) {
      case ModerationActionType.APPROUVER:
        await this.approveTool(id);
        await this.sendApprovalEmail(tool);
        break;

      case ModerationActionType.REJETER:
        await this.rejectTool(id);
        await this.sendRejectionEmail(tool, reasons, comment);
        break;

      case ModerationActionType.SUPPRIMER:
        await this.deleteTool(id);
        await this.sendDeletionEmail(tool, reasons, comment);
        break;
    }

    return this.findOne(id);
  }

  private async approveTool(id: string) {
    await this.prisma.tool.update({
      where: { id },
      data: {
        publicationStatus: ToolStatus.PUBLIE,
        availabilityStatus: AvailabilityStatus.DISPONIBLE,
        publishedAt: new Date(),
        moderatedAt: new Date(),
      }
    });
  }

  private async rejectTool(id: string) {
    await this.prisma.tool.update({
      where: { id },
      data: {
        publicationStatus: ToolStatus.REJETE,
        moderatedAt: new Date(),
      }
    });
  }

  private async deleteTool(id: string) {
    await this.prisma.tool.delete({
      where: { id }
    });
  }

  private async createPricingTiers(toolId: string, basePrice: number) {
    const pricingTiers = [
      { duration: 1, discount: 0, finalPrice: basePrice },
      { duration: 2, discount: 30, finalPrice: basePrice * 0.7 },
      { duration: 7, discount: 50, finalPrice: basePrice * 0.5 },
    ];

    await this.prisma.toolPricing.createMany({
      data: pricingTiers.map(tier => ({
        ...tier,
        toolId,
      }))
    });
  }

  private async updatePricingTiers(toolId: string, basePrice: number) {
    // Delete existing pricing
    await this.prisma.toolPricing.deleteMany({
      where: { toolId }
    });

    // Create new pricing
    await this.createPricingTiers(toolId, basePrice);
  }

  private async handleToolPhotos(toolId: string, photos: Express.Multer.File[]) {
    const photoData = photos
      .filter(photo => photo && photo.filename)
      .map((photo, index) => ({
        url: `/uploads/tools/${photo.filename}`,
        filename: photo.filename,
        isPrimary: index === 0,
        toolId,
      }));

    if (photoData.length > 0) {
      await this.prisma.toolPhoto.createMany({
        data: photoData
      });
    }
  }

  private async handleToolAvailability(toolId: string, dates: Date[]) {
    const availabilityData = dates.map(date => ({
      date: new Date(date),
      isAvailable: true,
      toolId,
    }));

    await this.prisma.toolAvailability.createMany({
      data: availabilityData
    });
  }

  private async updateToolAvailability(toolId: string, dates: Date[]) {
    // Delete existing availability
    await this.prisma.toolAvailability.deleteMany({
      where: { toolId }
    });

    // Create new availability
    await this.handleToolAvailability(toolId, dates);
  }

  private async sendApprovalEmail(tool: any) {
    const subject = 'Votre annonce a été approuvée - BRICOLA';
    const html = `
      <h2>Félicitations !</h2>
      <p>Votre annonce "${tool.title}" a été approuvée et est maintenant visible sur la plateforme BRICOLA.</p>
      <p>Vous pouvez maintenant recevoir des demandes de réservation.</p>
    `;

    await this.mailerService.send(tool.owner.email, subject, html);
  }

  private async sendRejectionEmail(tool: any, reasons: string[], comment?: string) {
    const subject = 'Votre annonce a été rejetée - BRICOLA';
    const reasonsList = reasons.map(reason => `<li>${reason}</li>`).join('');
    
    const html = `
      <h2>Annonce rejetée</h2>
      <p>Votre annonce "${tool.title}" a été rejetée pour les raisons suivantes :</p>
      <ul>${reasonsList}</ul>
      ${comment ? `<p><strong>Commentaire :</strong> ${comment}</p>` : ''}
      <p>Vous pouvez modifier votre annonce et la soumettre à nouveau pour modération.</p>
    `;

    await this.mailerService.send(tool.owner.email, subject, html);
  }

  private async sendDeletionEmail(tool: any, reasons: string[], comment?: string) {
    const subject = 'Votre annonce a été supprimée - BRICOLA';
    const reasonsList = reasons.map(reason => `<li>${reason}</li>`).join('');
    
    const html = `
      <h2>Annonce supprimée</h2>
      <p>Votre annonce "${tool.title}" a été supprimée définitivement pour les raisons suivantes :</p>
      <ul>${reasonsList}</ul>
      ${comment ? `<p><strong>Commentaire :</strong> ${comment}</p>` : ''}
      <p>Cette action est définitive et irréversible.</p>
    `;

    await this.mailerService.send(tool.owner.email, subject, html);
  }

  // Category and Subcategory methods
  async getCategories() {
    return this.prisma.category.findMany({
      include: {
        subcategories: true,
      }
    });
  }

  async getSubcategories(categoryName: ToolCategory) {
    return this.prisma.subcategory.findMany({
      where: {
        category: {
          name: categoryName
        }
      }
    });
  }

  // Statistics for admin dashboard
  async getToolStatistics() {
    const [totalTools, publishedTools, pendingTools, rejectedTools, averagePrice] = await Promise.all([
      this.prisma.tool.count(),
      this.prisma.tool.count({ where: { publicationStatus: ToolStatus.PUBLIE } }),
      this.prisma.tool.count({ where: { publicationStatus: ToolStatus.EN_ATTENTE } }),
      this.prisma.tool.count({ where: { publicationStatus: ToolStatus.REJETE } }),
      this.prisma.tool.aggregate({
        where: { publicationStatus: ToolStatus.PUBLIE },
        _avg: { basePrice: true },
        _min: { basePrice: true },
        _max: { basePrice: true },
      }),
    ]);

    return {
      totalTools,
      publishedTools,
      pendingTools,
      rejectedTools,
      priceStats: {
        average: Math.round(averagePrice._avg.basePrice || 0),
        min: averagePrice._min.basePrice || 0,
        max: averagePrice._max.basePrice || 0,
      },
    };
  }

  async getPriceStatistics() {
    const priceStats = await this.prisma.tool.aggregate({
      where: { publicationStatus: ToolStatus.PUBLIE },
      _avg: { basePrice: true },
      _min: { basePrice: true },
      _max: { basePrice: true },
    });

    return {
      average: Math.round(priceStats._avg.basePrice || 0),
      min: priceStats._min.basePrice || 0,
      max: priceStats._max.basePrice || 0,
    };
  }

  // Review methods
  async getToolReviews(toolId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { toolId },
        include: {
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { toolId } }),
    ]);

    return {
      data: reviews,
      total,
      page,
      pageSize: limit,
    };
  }

  async createToolReview(toolId: string, createReviewDto: CreateReviewDto, reviewerId: string) {
    // Check if tool exists
    const tool = await this.prisma.tool.findUnique({
      where: { id: toolId },
      include: { owner: true }
    });

    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    // Check if user has already reviewed this tool
    const existingReview = await this.prisma.review.findFirst({
      where: {
        toolId,
        reviewerId,
      }
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this tool');
    }

    // Create the review
    const review = await this.prisma.review.create({
      data: {
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
        toolId,
        reviewerId,
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return review;
  }

  async updateToolReview(reviewId: string, updateReviewDto: UpdateReviewDto, reviewerId: string) {
    // Check if review exists and belongs to the user
    const existingReview = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        reviewerId,
      }
    });

    if (!existingReview) {
      throw new NotFoundException('Review not found or you are not authorized to edit it');
    }

    // Update the review
    const review = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: updateReviewDto.rating,
        comment: updateReviewDto.comment,
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return review;
  }

  async deleteToolReview(reviewId: string, reviewerId: string) {
    // Check if review exists and belongs to the user
    const existingReview = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        reviewerId,
      }
    });

    if (!existingReview) {
      throw new NotFoundException('Review not found or you are not authorized to delete it');
    }

    // Delete the review
    await this.prisma.review.delete({
      where: { id: reviewId }
    });

    return { message: 'Review deleted successfully' };
  }
}
