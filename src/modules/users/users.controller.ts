import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard, JwtAuthGuard } from '../../common/guards';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';

const imageFileFilter = (req, file, callback) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
    return callback(new BadRequestException('Only image files are allowed!'), false);
  }
  callback(null, true);
};


@Controller('users')
@UseGuards(JwtAuthGuard) 
export class UsersController {
    private readonly logger = new Logger(UsersController.name);
    constructor(
        private readonly usersService: UsersService,
    ){}

    @Get(':id')
    getUserById(@Param('id') id: string ) {
        const user = this.usersService.findUserById(id);
        return plainToInstance(UserResponseDto,user);
    }
    @Get('me')
    @UseGuards(JwtAuthGuard)
    getCurrentUser(@CurrentUser('id') id: string) {
        const user = this.usersService.findUserById(id);
        return plainToInstance(UserResponseDto,user);
    }
    @Post('profile-picture')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: imageFileFilter,
        storage : null
    }))
    
    async uploadProfilePicture(
        @CurrentUser('id') userId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        
        const result = await this.usersService.uploadProfilePicture(userId, file);
        return result;
    }

    @Get('all')
    @UseGuards(AdminGuard)
    async getUsers(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('search') search?: string
        ) {
        this.logger.debug(`Fetching users with page: ${page}, limit: ${limit}, search: ${search}`);
        const users= this.usersService.getUsers(page, limit,search);
        return users;
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    async deleteUser(
        @Param('id') id: string,
        @Body('motive') motive: string
    ) {
        const user = await this.usersService.deleteUser(id,motive);
        return plainToInstance(UserResponseDto,user);
    }
    
    @Patch('status/:id')
    @UseGuards(AdminGuard)
    async changeUserStatus(@Param('id') id: string, @Body('motive') motive?: string) {
        const user = await this.usersService.changeUserStatus(id, motive);
        return plainToInstance(UserResponseDto,user);
    }
}
