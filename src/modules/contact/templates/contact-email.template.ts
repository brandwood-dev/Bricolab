export const contactFormEmailTemplate = (
  firstName: string,
  lastName: string,
  email: string,
  subject: string,
  message: string,
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .content {
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            .field {
                margin-bottom: 15px;
            }
            .label {
                font-weight: bold;
                color: #495057;
                margin-bottom: 5px;
                display: block;
            }
            .value {
                background-color: #f8f9fa;
                padding: 10px;
                border-radius: 4px;
                border-left: 4px solid #007bff;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2 style="margin: 0; color: #007bff;">New Contact Form Submission</h2>
            <p style="margin: 5px 0 0 0; color: #6c757d;">Bricolab Contact Form</p>
        </div>
        
        <div class="content">
            <div class="field">
                <span class="label">Full Name:</span>
                <div class="value">${firstName} ${lastName}</div>
            </div>
            
            <div class="field">
                <span class="label">Email Address:</span>
                <div class="value">${email}</div>
            </div>
            
            <div class="field">
                <span class="label">Subject:</span>
                <div class="value">${subject}</div>
            </div>
            
            <div class="field">
                <span class="label">Message:</span>
                <div class="value" style="white-space: pre-wrap;">${message}</div>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; font-size: 14px; color: #6c757d;">
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
  `;
};

export const contactAutoReplyTemplate = (firstName: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Contacting Bricolab</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0;"> Thank You for Contacting Us!</h2>
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <p>Dear ${firstName},</p>
            
            <p>Thank you for reaching out to <strong>Bricolab</strong>! We have received your message and appreciate you taking the time to contact us.</p>
            
            <p><strong>What happens next?</strong></p>
            <ul>
                <li>📧 Our team will review your message carefully</li>
                <li>🕒 We typically respond within 24-48 hours</li>
                <li>📞 For urgent matters, feel free to call us at +33 1 23 45 67 89</li>
            </ul>
            
            <p>Best regards,<br>
            <strong>The Bricolab Team</strong></p>
        </div>
    </body>
    </html>
  `;
};
