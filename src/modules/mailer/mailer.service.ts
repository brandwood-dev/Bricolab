import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
    private readonly logger = new Logger(MailerService.name);
    constructor(
        private readonly configService: ConfigService,    
    ) {}
    emailTransport(){
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: this.configService.get<string>('EMAIL_USER'), 
                pass: this.configService.get<string>('EMAIL_PASS'), 
            },
            tls: {
            rejectUnauthorized: false
        }
            
    })

    return transporter;
}

async send(to: string, subject: string, html: string) {
    

    const transport = this.emailTransport();

    const options: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to:String(to),
      subject:String(subject),
      //text: typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text),
      html: html,
    };
    try {
      await transport.sendMail(options);
      this.logger.log(`Email sent to ${to} successfully.`);
    } catch (error) {
      throw new Error(`Failed to send email to ${to}: ${error.message}`);
    }

}
}