import { Injectable } from '@nestjs/common';
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AccountDeletionRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(userId: string) { 
    return await this.prisma.account_deletion_requests.create({
      data: {
        user_id: userId,
      },
    });
  }

  async findPendingRequests() { 
    return await this.prisma.account_deletion_requests.findMany({
      where: { status: 'PENDING' },
      include: {
        user: true,
        reviewed_by_admin: true,
      },
    });
  }
    async findPendingDeletionRequestByUserId(userId: string) { 
        return await this.prisma.account_deletion_requests.findFirst({
        where: {
            user_id: userId,
            status: 'PENDING',
        },
        include:{
            user: true,
            reviewed_by_admin: true,
        }
        });
    }

  async markReviewed(id: string, adminId: string) { 
    return await this.prisma.account_deletion_requests.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewed_by_admin_id: adminId,
        reviewed_at: new Date(),
      },
    });
   }
    async rejectRequest(id: string, adminId: string) { 
        return await this.prisma.account_deletion_requests.update({
        where: { id },
        data: {
            status: 'REJECTED',
            reviewed_by_admin_id: adminId,
            reviewed_at: new Date(),
        },
        });
    }
}