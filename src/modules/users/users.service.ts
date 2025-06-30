import { Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@prisma/client';
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
        return this.usersRepository.createUser(dto);
    }

    /**
     * Find a user by ID
     * @param id
     * @returns User | null
     */
    async findUserById(id: string): Promise<User | null> {
        return this.usersRepository.findUserById(id);
    }

    /**
     * Find a user by email
     * @param email
     * @returns User | null
     */
    async findUserByEmail(email: string): Promise<User | null> {
        this.logger.debug(`Finding user by email: ${email}`);
        return this.usersRepository.findUserByEmail(email);
    }

    /**
     * Update a user
     * @param id
     * @param data
     * @returns User
     */
    async updateUser(id: string, data: Partial<CreateUserDto>): Promise<User> {
        return this.usersRepository.updateUser(id, data);
    }

    async findUserByRefreshToken(refreshToken: string): Promise<User | null> {
        const user = await this.usersRepository.findUserByRefreshToken(refreshToken);
        return user;
    }

}
