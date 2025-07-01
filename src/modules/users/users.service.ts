import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma, User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        private readonly usersRepository: UsersRepository,
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

    /**
     * Update a user
     * @param id
     * @param data
     * @returns User
     */
    async updateUser(id: string, data: Partial<UpdateUserDto>): Promise<User> {
    try {
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

}
