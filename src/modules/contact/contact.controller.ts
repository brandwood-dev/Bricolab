import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpStatus,
  HttpCode,
  ValidationPipe,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Contact, ContactStatus } from '@prisma/client';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createContact(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    createContactDto: CreateContactDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: { id: string; createdAt: Date } | null;
  }> {
    try {
      const contact = await this.contactService.createContact(createContactDto);

      return {
        success: true,
        message:
          'Your message has been sent successfully! We will get back to you soon.',
        data: {
          id: contact.id,
          createdAt: contact.createdAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        message:
          'Sorry, there was an error sending your message. Please try again later.',
        data: null,
      };
    }
  }

  @Get()
  async getAllContacts(): Promise<Contact[]> {
    return this.contactService.getAllContacts();
  }

  @Get(':id')
  async getContactById(@Param('id') id: string): Promise<Contact | null> {
    return this.contactService.getContactById(id);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string): Promise<Contact> {
    return this.contactService.markAsRead(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ContactStatus,
  ): Promise<Contact> {
    return this.contactService.updateContactStatus(id, status);
  }

  @Delete(':id')
  async deleteContact(@Param('id') id: string): Promise<Contact> {
    return this.contactService.deleteContact(id);
  }
}
