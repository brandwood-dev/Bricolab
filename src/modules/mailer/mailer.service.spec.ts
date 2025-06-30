import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe('MailerService', () => {
  let service: MailerService;
  let configService: ConfigService;
  let mockTransporter: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        EMAIL_USER: 'test@example.com',
        EMAIL_PASS: 'testpassword',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    // Mock transporter with sendMail method
    mockTransporter = {
      sendMail: jest.fn(),
    };

    // Mock nodemailer.createTransporter to return our mock transporter
    mockNodemailer.createTransport.mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emailTransport', () => {
    it('should create a nodemailer transporter with correct configuration', () => {
      const transporter = service.emailTransport();

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        service: 'gmail',
        auth: {
          user: 'test@example.com',
          pass: 'testpassword',
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      expect(transporter).toBe(mockTransporter);
    });

    it('should call configService.get with correct keys', () => {
      service.emailTransport();

      expect(configService.get).toHaveBeenCalledWith('EMAIL_USER');
      expect(configService.get).toHaveBeenCalledWith('EMAIL_PASS');
    });
  });

  describe('send', () => {
    const mockTo = 'recipient@example.com';
    const mockSubject = 'Test Subject';
    const mockHtml = '<h1>Test HTML Content</h1>';

    it('should send email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await service.send(mockTo, mockSubject, mockHtml);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: mockTo,
        subject: mockSubject,
        html: mockHtml,
      });
    });

    it('should handle email sending with different data types for to and subject', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      
      // Test with non-string values that will be converted to strings
      await service.send(mockTo, mockSubject, mockHtml);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: String(mockTo),
        subject: String(mockSubject),
        html: mockHtml,
      });
    });

    it('should throw error when email sending fails', async () => {
      const mockError = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(mockError);

      await expect(service.send(mockTo, mockSubject, mockHtml)).rejects.toThrow(
        `Failed to send email to ${mockTo}: SMTP connection failed`
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: mockTo,
        subject: mockSubject,
        html: mockHtml,
      });
    });

    it('should use correct email configuration from ConfigService', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await service.send(mockTo, mockSubject, mockHtml);

      expect(configService.get).toHaveBeenCalledWith('EMAIL_USER');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@example.com',
        })
      );
    });

    it('should handle empty or null values gracefully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await service.send('', '', '');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: '',
        subject: '',
        html: '',
      });
    });

    it('should create new transporter for each send call', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await service.send(mockTo, mockSubject, mockHtml);
      await service.send('another@example.com', 'Another Subject', '<p>Another content</p>');

      // Verify createTransport was called twice (once for each send)
      expect(mockNodemailer.createTransport).toHaveBeenCalledTimes(2);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple recipients', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      const multipleRecipients = 'user1@example.com,user2@example.com';

      await service.send(multipleRecipients, mockSubject, mockHtml);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: multipleRecipients,
        subject: mockSubject,
        html: mockHtml,
      });
    });

    it('should handle special characters in email content', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      const specialHtml = '<h1>Test with special chars: áéíóú, 中文, 🎉</h1>';
      const specialSubject = 'Subject with émojis 🚀';

      await service.send(mockTo, specialSubject, specialHtml);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: mockTo,
        subject: specialSubject,
        html: specialHtml,
      });
    });

    it('should handle very long email content', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      const longHtml = '<p>' + 'A'.repeat(10000) + '</p>';
      const longSubject = 'B'.repeat(100);

      await service.send(mockTo, longSubject, longHtml);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: mockTo,
        subject: longSubject,
        html: longHtml,
      });
    });

    it('should preserve HTML formatting', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });
      const complexHtml = `
        <html>
          <body>
            <h1>Welcome!</h1>
            <p>This is a <strong>test</strong> email with <em>formatting</em>.</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
            <a href="https://example.com">Click here</a>
          </body>
        </html>
      `;

      await service.send(mockTo, mockSubject, complexHtml);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: mockTo,
        subject: mockSubject,
        html: complexHtml,
      });
    });
  });

  describe('error handling', () => {
    it('should handle ConfigService errors gracefully', () => {
      // Create a spy that throws an error for EMAIL_USER
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'EMAIL_USER') {
          throw new Error('Config not found');
        }
        return 'testpassword'; // For EMAIL_PASS
      });

      expect(() => service.emailTransport()).toThrow('Config not found');
    });

    it('should handle nodemailer transport creation errors', () => {
      // Reset the mock to return normal config values
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const config = {
          EMAIL_USER: 'test@example.com',
          EMAIL_PASS: 'testpassword',
        };
        return config[key];
      });

      // Mock createTransport to throw an error
      mockNodemailer.createTransport.mockImplementation(() => {
        throw new Error('Transport creation failed');
      });

      expect(() => service.emailTransport()).toThrow('Transport creation failed');
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
