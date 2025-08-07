import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async addToFavorites(userId: string, toolId: string) {
    // Check if tool exists
    const tool = await this.prisma.tool.findUnique({
      where: { id: toolId },
      include: {
        category: true,
        subcategory: true,
        photos: true,
        owner: true,
      },
    });

    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    // Check if already favorited
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Tool is already in favorites');
    }

    // Add to favorites
    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        toolId,
      },
      include: {
        tool: {
          include: {
            category: true,
            subcategory: true,
            photos: true,
            owner: true,
          },
        },
      },
    });

    return favorite;
  }

  async removeFromFavorites(userId: string, toolId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favorite.delete({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
    });

    return { message: 'Favorite removed successfully' };
  }

  async getUserFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        tool: {
          include: {
            category: true,
            subcategory: true,
            photos: true,
            owner: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map(fav => ({
      id: fav.tool.id,
      title: fav.tool.title,
      description: fav.tool.description,
      basePrice: fav.tool.basePrice,
      photos: fav.tool.photos,
      pickupAddress: fav.tool.pickupAddress,
      category: fav.tool.category,
      subcategory: fav.tool.subcategory,
      owner: fav.tool.owner,
      availabilityStatus: fav.tool.availabilityStatus,
      condition: fav.tool.condition,
      createdAt: fav.tool.createdAt,
      reviewStats: {
        averageRating: fav.tool.reviews.length > 0 
          ? fav.tool.reviews.reduce((sum, review) => sum + review.rating, 0) / fav.tool.reviews.length 
          : 0,
        totalReviews: fav.tool.reviews.length,
      },
    }));
  }

  async isFavorite(userId: string, toolId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
    });

    return !!favorite;
  }

  async getFavoritesCount(userId: string) {
    return await this.prisma.favorite.count({
      where: { userId },
    });
  }
} 