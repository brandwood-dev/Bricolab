import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "@prisma/client";
import { UpdateUserDto } from "./dto/update-user.dto";
import { paginate } from "../../common/utils/paginate";
import { UserResponseDto } from "./dto/user-response.dto";


@Injectable()
export class UsersRepository {
    private readonly logger = new Logger(UsersRepository.name);
    constructor(
        private readonly prisma : PrismaService,
    ) {}

    async createUser(dto: CreateUserDto): Promise<User> {
        const user = await this.prisma.user.create({
            data: {
                ...dto,
            }
        });
        this.logger.log('User created with ID: ' + user.id);
        return user;
    }

    async findUserById(id: string): Promise<User | null> {
        const user = this.prisma.user.findUnique({
            where: { id },
        });
        this.logger.log('Finding user by ID: ' + id);
        return user;
    }

    async findUserByEmail(email: string): Promise<User | null> {
        const user =  this.prisma.user.findUnique({
            where: { email },
        });
        this.logger.log('Finding user by email: ' + email);
        return user;
    }

    async updateUser(id: string, data: Partial<UpdateUserDto>): Promise<User> {
        const user =  this.prisma.user.update({
            where: { id },
            data,
        });
        this.logger.log('Updating user with ID: ' + id);
        return user;
    }

    async findUserByRefreshToken(refreshToken: string): Promise<User | null> {
        const user = await this.prisma.user.findFirst({
            where: {
                refresh_token: refreshToken,
            },
        })
        this.logger.log('Finding user by refresh token: ' + refreshToken);
        return user;
    }

    async getUsers(page: number, limit: number, search?: string) {
        this.logger.debug(`Fetching users with page: ${page}, limit: ${limit}, search: ${search}`);
        return paginate(this.prisma.user, page, limit,UserResponseDto,['firstName','lastName','email'], search);
    }

    async deleteUser(id: string): Promise<User> {
        const user = await this.prisma.user.delete({
            where: { id },
        });
        return user;
    }
}