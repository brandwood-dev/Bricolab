import { Controller, Post, Delete, Get, Param, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':toolId')
  async addToFavorites(@Request() req, @Param('toolId') toolId: string) {
    const userId = req.user.id;
    return await this.favoritesService.addToFavorites(userId, toolId);
  }

  @Delete(':toolId')
  async removeFromFavorites(@Request() req, @Param('toolId') toolId: string) {
    const userId = req.user.id;
    return await this.favoritesService.removeFromFavorites(userId, toolId);
  }

  @Get()
  async getUserFavorites(@Request() req) {
    const userId = req.user.id;
    return await this.favoritesService.getUserFavorites(userId);
  }

  @Get('count')
  async getFavoritesCount(@Request() req) {
    const userId = req.user.id;
    return { count: await this.favoritesService.getFavoritesCount(userId) };
  }

  @Get('check/:toolId')
  async isFavorite(@Request() req, @Param('toolId') toolId: string) {
    const userId = req.user.id;
    return { isFavorite: await this.favoritesService.isFavorite(userId, toolId) };
  }
} 