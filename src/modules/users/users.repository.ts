import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "@prisma/client";

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
        return user;
    }

    async findUserById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async findUserByEmail(email: string): Promise<User | null> {
        this.logger.debug(`Finding user by email: ${email}`);
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async updateUser(id: string, data: Partial<CreateUserDto>): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async findUserByRefreshToken(refreshToken: string): Promise<User | null> {
        const user = await this.prisma.user.findFirst({
            where: {
                refresh_token: refreshToken,
            },
        })
        return user;
    }


}