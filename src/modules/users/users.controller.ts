import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard, JwtAuthGuard } from '../../common/guards';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateUserDto } from './dto/update-user.dto';

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

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getCurrentUser(@CurrentUser('id') id: string) {
        const user =await this.usersService.findUserById(id);
        const deletionRequest = await this.usersService.findDeletionRequestByUserId(id);
        const response = plainToInstance(UserResponseDto,user,{
            exposeUnsetFields: false,
        });
        response.hasDeletionRequest = !!deletionRequest && deletionRequest.status === 'PENDING';
        return response;
    }

    @Get(':id')
    async getUserById(@Param('id') id: string ) {
        const user = await this.usersService.findUserById(id);
        return plainToInstance(UserResponseDto,user);
    }
    
    @Patch('profile-picture')
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
        const users= await this.usersService.getUsers(page, limit,search);
        return users;
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    async deleteUser(
        @Param('id') userId: string,
    ) {
        const user = await this.usersService.deleteUser(userId);
        return plainToInstance(UserResponseDto,user);
    }
    
    @Patch('status/:id')
    @UseGuards(AdminGuard)
    async changeUserStatus(@Param('id') id: string, @Body('motive') motive?: string) {
        const user = await this.usersService.changeUserStatus(id, motive);
        return plainToInstance(UserResponseDto,user);
    }
    @Patch('id-card')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'idFront', maxCount: 1 },
        { name: 'idBack', maxCount: 1 }
        ], {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: imageFileFilter,
        storage: null
    }))
    async uploadIdCard(
        @CurrentUser('id') userId: string,
        @UploadedFiles() files: { idFront: Express.Multer.File[], idBack: Express.Multer.File[] }
    ) {
        
        const idCardFront = files.idFront[0];
        const idCardBack = files.idBack[0];
        
        const result = await this.usersService.uploadIdCard(userId, [idCardFront, idCardBack]);
        return result;
    }

    @Patch('verify-user/:id')
    @UseGuards(AdminGuard)
    async verifyAccount(@Param('id') id: string) {
        const user = await this.usersService.verifyUser(id);
        return plainToInstance(UserResponseDto, user);
    }
    @Patch()
    async updateUser(@CurrentUser('id') userId: string, @Body() updateData: UpdateUserDto) {
        const updatedUser = await this.usersService.updateUser(userId, updateData);
        return plainToInstance(UserResponseDto, updatedUser);
    }

    @Post('request-account-deletion')
    async requestAccountDeletion(@CurrentUser('id') userId: string) {
        const result = await this.usersService.requestAccountDeletion(userId);
        return {
            ...result
        };
    }

    @Get('pending-deletion-requests')
    @UseGuards(AdminGuard)
    async findPendingDeletionRequests() {
        const requests = await this.usersService.findPendingDeletionRequests();
        return requests.map(request => plainToInstance(UserResponseDto, request.user));
    }

    @Patch('reject-deletion-request/:id')
    @UseGuards(AdminGuard)
    async rejectDeletionRequest(
        @Param('id') id: string,
        @CurrentUser('id') adminId: string,
        @Body('reason') reason: string = 'No reason provided'
    ) {
        const result = await this.usersService.rejectDeletionRequest(id, adminId,reason);
        return { 
            ...result
        };
    }
}
