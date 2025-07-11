import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma, User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { UplaodService } from '../uplaod/uplaod.service';
import { MailerService } from '../mailer/mailer.service';
import { accountStatusTemplate } from '../mailer/mail_templates/change_status_email';
import { deleteAccountTemplate } from '../mailer/mail_templates/delete_email';
import { randomBytes } from 'crypto';
import { verifyEmailTemplate } from '../mailer/mail_templates';
import {AccountDeletionRequestRepository} from './account_deletion_requests.repository';
import { rejectAccountDeletionTemplate } from '../mailer/mail_templates/reject_delete_email';
@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly uploadService: UplaodService,
        private readonly mailerService: MailerService,
        private readonly accountDeletionRequestRepository: AccountDeletionRequestRepository,
    ){}
    /**
     * Create a new user
     * @param createUserDto
     * @returns User
     * @throws ConflictException
     */
    async createUser(dto: CreateUserDto): Promise<User> {
        try {
            return await this.usersRepository.createUser(dto);
        }catch (error) {
            if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                this.logger.error(`Email already exists: ${dto.email}`);
                throw new ConflictException('Email already exists');
            }
            throw error;
        }
    }

    /**
     * Find a user by ID
     * @param id
     * @returns User | null
     */
    async findUserById(id: string): Promise<User | null> {
        const user =  await this.usersRepository.findUserById(id);
        if(!user){
            this.logger.warn(`User not found with ID: ${id}`);
            return null;
        }
        return user;
    }

    async findDeletionRequestByUserId(userId: string){
        const request = await this.accountDeletionRequestRepository.findPendingDeletionRequestByUserId(userId);
        if(!request){
            return null;
        }
        return request;
    }

    /**
     * Find a user by email
     * @param email
     * @returns User | null
     */
    async findUserByEmail(email: string): Promise<User | null> {
        
        const user = await this.usersRepository.findUserByEmail(email);
        if(!user){
            this.logger.warn(`User not found with email: ${email}`);
            return null;
        }
        return user;
    }
    async findUserByNewEmail(newEmail: string): Promise<User | null> {
        const user = await this.usersRepository.findUserByNewEmail(newEmail);
        if(!user){
            this.logger.warn(`User not found with new email: ${newEmail}`);
            return null;
        }
        return user;
    }

    /**
     * Update a user
     * @param id
     * @param data
     * @returns User
     */
    async updateUser(id: string, data: Partial<UpdateUserDto>): Promise<User> {
    try {
        if(data.newEmail){
            const pattern = /^(?=.*[a-z])(?=.*\d)[a-z0-9]{6}$/;
            let token: string;
            do {
                token = randomBytes(3).toString('hex');
            } while (!pattern.test(token));
            const user = await this.usersRepository.updateUser(id, { newEmail: data.email, verify_token: token, verified_email: false });
            this.logger.log('User', user);
            if (!user) {
                this.logger.warn(`User not found during update`);
                throw new NotFoundException(`User not found`);
            }
            let html = verifyEmailTemplate;
            html = html.replaceAll('&CODE&', token);
            await this.mailerService.send(data.newEmail, 'Verify your email', html);
            
        }
        const user = await this.usersRepository.updateUser(id, data);

        if (!user) {
        this.logger.warn(`User not found during update`);
        throw new NotFoundException(`User not found`);
        }

        this.logger.log(`User updated`);
        return user;
    } catch (error) {
        this.logger.error('Failed to update user', {
        userId: id,
        data,
        error: error instanceof Error ? error.message : String(error),
        });

        throw error instanceof NotFoundException ? error : new InternalServerErrorException('Could not update user');
    }
    }

    async findUserByRefreshToken(refreshToken: string): Promise<User> {
        const user = await this.usersRepository.findUserByRefreshToken(refreshToken);
        if(!user) {
            this.logger.warn(`User not found`);
            throw new NotFoundException(`User not found`);
        }
        return user;
    }

    async uploadProfilePicture(userId: string, filePath: Express.Multer.File){
        if(!filePath){
            this.logger.error('No file provided');
            throw new BadRequestException('No file provided');
        }
        const user = await this.usersRepository.findUserById(userId);
        if (!user) {
            this.logger.warn(`User not found with ID: ${userId}`);
            throw new NotFoundException(`User not found`);
        }
        const imageUrl = await this.uploadService.uploadFileLocal(filePath, 'profile-pictures');
        await this.usersRepository.updateUser(userId, { profilePicture: imageUrl });
        this.logger.log(`Profile picture uploaded for user ID: ${userId}`);
        return {
            message: 'Profile picture uploaded successfully',
            imageUrl: imageUrl
        }
    }
    async getUsers(page:number, limit: number, search?: string) {
        this.logger.debug(`Fetching users with page: ${page}, limit: ${limit}, search: ${search}`);
        const result = await this.usersRepository.getUsers(page, limit,search);
        return result;
    }

    async deleteUser(id: string): Promise<User> {
    const user = await this.usersRepository.deleteUser(id);
        if(!user) {
            this.logger.warn(`User not found with ID: ${id}`);
            throw new NotFoundException(`User not found`);
        }
        this.logger.log(`User deleted with ID: ${id}`);
        await this.mailerService.send(user.email, 'Suppression de votre compte',deleteAccountTemplate());
        return user;
    }

    async changeUserStatus(id: string, motive?: string): Promise<User> {
        const user = await this.usersRepository.findUserById(id);
        if(!user) {
            this.logger.warn(`User not found with ID: ${id}`);
            throw new NotFoundException(`User not found`);
        }
        const updatedUser = await this.usersRepository.updateUser(id, { isActive: !user.isActive });
        this.logger.log(`User status changed for ID: ${id}`);
        const subject = updatedUser.isActive ? 'compte activé' : 'compte désactivé';
        await this.mailerService.send(user.email,subject,accountStatusTemplate(updatedUser.isActive,motive));
        return updatedUser;
    }

    async uploadIdCard(userId: string, files: Express.Multer.File[]) {
    if (!files || files.length !== 2) {
        this.logger.error('Two ID card images are required');
        throw new BadRequestException('You must upload both front and back of the ID card');
    }

    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
        this.logger.warn(`User not found with ID: ${userId}`);
        throw new NotFoundException('User not found');
    }

    const [idCardFront, idCardBack] = await Promise.all([
        this.uploadService.uploadFileLocal(files[0], 'id-cards'),
        this.uploadService.uploadFileLocal(files[1], 'id-cards')
    ]);

    await this.usersRepository.updateUser(userId, {
        idCardFront,
        idCardBack
    });

    this.logger.log(`ID card (front & back) uploaded for user ID: ${userId}`);
    return {
        message: 'ID card images uploaded successfully',
        idCardFront,
        idCardBack
    };
}

async verifyUser(id: string) {
    const user = await this.usersRepository.findUserById(id);
    if (!user) {
        this.logger.warn(`User not found with ID: ${id}`);
        throw new NotFoundException(`User not found`);
    }
    if (user.isVerified) {
        this.logger.warn(`User already verified with ID: ${id}`);
        throw new ConflictException(`User already verified`);
    }
    const updatedUser = await this.usersRepository.updateUser(id, { 
        isVerified: true,
        idCardBack: null,
        idCardFront: null,
    });
    this.logger.log(`User verified with ID: ${id}`);
    return updatedUser;
}

async requestAccountDeletion(userId: string) {
    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
        this.logger.warn(`User not found with ID: ${userId}`);
        throw new NotFoundException(`User not found`);
    }
    const existingRequest = await this.accountDeletionRequestRepository.findPendingDeletionRequestByUserId(userId);
    if (existingRequest) {
        this.logger.warn(`Deletion request already exists for user ID: ${userId}`);
        throw new ConflictException('You already have a pending account deletion request');
    }

    await this.accountDeletionRequestRepository.createRequest(userId);
    return {
        message: 'Account deletion request created successfully. Please wait for admin approval.'
    }
}

async findPendingDeletionRequests() {
    const requests = await this.accountDeletionRequestRepository.findPendingRequests();
    if (!requests || requests.length === 0) {
        this.logger.warn('No pending deletion requests found');
        return [];
    }
    return requests;
}

async rejectDeletionRequest(requestId: string, adminId: string, reason: string) {
    const request = await this.accountDeletionRequestRepository.findPendingDeletionRequestByUserId(requestId);
    if (!request) {
        this.logger.warn(`Deletion request not found with ID: ${requestId}`);
        throw new NotFoundException(`Deletion request not found`);
    }
    await this.accountDeletionRequestRepository.rejectRequest(requestId, adminId);
    const html = rejectAccountDeletionTemplate(reason);
    await this.mailerService.send(request.user.email, 'Account Deletion Request Rejected', html);
    this.logger.log(`Deletion request rejected with ID: ${requestId}`);
    return {
        message: 'Account deletion request rejected successfully'
    };
}
    
}
