import nodemailer from 'nodemailer';
import config from 'config';
import { getLogger } from '../core/logging';

const logger = getLogger();

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface PasswordResetEmailData {
  to: string;
  resetToken: string;
  userName: string;
  resetUrl: string;
}

interface CustomEmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor() {
    this.config = config.get<EmailConfig>('email');
    
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.auth.user,
        pass: this.config.auth.pass,
      },
    });
  }

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    try {
      const mailOptions = {
        from: this.config.from,
        to: data.to,
        subject: 'Wachtwoord reset - KSK Colle',
        html: this.generatePasswordResetEmailHTML(data),
        text: this.generatePasswordResetEmailText(data),
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent successfully', { to: data.to });
    } catch (error) {
      logger.error('Failed to send password reset email', { error, to: data.to });
      throw error;
    }
  }

  async sendCustomEmail(data: CustomEmailData): Promise<void> {
    try {
      const mailOptions = {
        from: this.config.from,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Custom email sent successfully', { to: data.to, subject: data.subject });
    } catch (error) {
      logger.error('Failed to send custom email', { error, to: data.to, subject: data.subject });
      throw error;
    }
  }

  private generatePasswordResetEmailHTML(data: PasswordResetEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Wachtwoord Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KSK Colle</h1>
            <h2>Wachtwoord Reset</h2>
          </div>
          
          <div class="content">
            <p>Beste ${data.userName},</p>
            
            <p>U heeft een wachtwoord reset aangevraagd voor uw account bij KSK Colle.</p>
            
            <p>Klik op de onderstaande knop om uw wachtwoord te resetten:</p>
            
            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Wachtwoord Resetten</a>
            </div>
            
            <p>Of kopieer deze link naar uw browser:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
              ${data.resetUrl}
            </p>
            
            <div class="warning">
              <strong>Belangrijk:</strong>
              <ul>
                <li>Deze link is 24 uur geldig</li>
                <li>Als u geen wachtwoord reset heeft aangevraagd, kunt u deze email negeren</li>
                <li>Uw huidige wachtwoord blijft ongewijzigd totdat u het reset</li>
              </ul>
            </div>
            
            <p>Met vriendelijke groet,<br>Het KSK Colle Team</p>
          </div>
          
          <div class="footer">
            <p>Deze email is automatisch gegenereerd. Reageer niet op deze email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetEmailText(data: PasswordResetEmailData): string {
    return `
KSK Colle - Wachtwoord Reset

Beste ${data.userName},

U heeft een wachtwoord reset aangevraagd voor uw account bij KSK Colle.

Klik op de volgende link om uw wachtwoord te resetten:
${data.resetUrl}

Belangrijk:
- Deze link is 24 uur geldig
- Als u geen wachtwoord reset heeft aangevraagd, kunt u deze email negeren
- Uw huidige wachtwoord blijft ongewijzigd totdat u het reset

Met vriendelijke groet,
Het KSK Colle Team

Deze email is automatisch gegenereerd. Reageer niet op deze email.
    `;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Email service connection failed', { error });
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
