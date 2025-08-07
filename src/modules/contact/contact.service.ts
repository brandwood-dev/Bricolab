import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Contact, ContactStatus } from '@prisma/client';
import {
  contactFormEmailTemplate,
  contactAutoReplyTemplate,
} from './templates/contact-email.template';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async createContact(createContactDto: CreateContactDto): Promise<Contact> {
    try {
      // 1. Save contact to database
      const contact = await this.prisma.contact.create({
        data: {
          firstName: createContactDto.firstName,
          lastName: createContactDto.lastName,
          email: createContactDto.email,
          subject: createContactDto.subject,
          message: createContactDto.message,
          status: ContactStatus.NEW,
          isRead: false,
        },
      });

      // 2. Send notification email to admin
      await this.sendContactNotification(contact);

      // 3. Send auto-reply to user
      await this.sendAutoReply(contact);

      this.logger.log(`New contact form submitted by ${contact.email}`);
      return contact;
    } catch (error) {
      this.logger.error(`Failed to create contact: ${error.message}`);
      throw new Error('Failed to process contact form submission');
    }
  }

  private async sendContactNotification(contact: Contact): Promise<void> {
    try {
      const emailHTML = contactFormEmailTemplate(
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.subject,
        contact.message,
      );

      await this.mailerService.send(
        'contact@bricolaltd.com', // Admin email
        `[Bricolab] New Contact: ${contact.subject}`,
        emailHTML,
      );

      this.logger.log(`Contact notification sent for submission ${contact.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send contact notification: ${error.message}`,
      );
      // Don't throw here - we don't want to fail the contact creation if email fails
    }
  }

  private async sendAutoReply(contact: Contact): Promise<void> {
    try {
      const emailHTML = contactAutoReplyTemplate(contact.firstName);

      await this.mailerService.send(
        contact.email,
        'Thank you for contacting Bricolab',
        emailHTML,
      );

      this.logger.log(`Auto-reply sent to ${contact.email}`);
    } catch (error) {
      this.logger.error(`Failed to send auto-reply: ${error.message}`);
      // Don't throw here - we don't want to fail the contact creation if email fails
    }
  }

  async getAllContacts(): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContactById(id: string): Promise<Contact | null> {
    return this.prisma.contact.findUnique({
      where: { id },
    });
  }

  async markAsRead(id: string): Promise<Contact> {
    return this.prisma.contact.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async updateContactStatus(
    id: string,
    status: ContactStatus,
  ): Promise<Contact> {
    return this.prisma.contact.update({
      where: { id },
      data: { status },
    });
  }

  async deleteContact(id: string): Promise<Contact> {
    return this.prisma.contact.delete({
      where: { id },
    });
  }
}
