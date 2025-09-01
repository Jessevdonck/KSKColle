import { Resend } from 'resend';
import { getLogger } from '../core/logging';
import config from 'config';

const logger = getLogger();

interface EmailConfig {
  apiKey: string;
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

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  description: string;
}

class EmailService {
  private resend: Resend | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      apiKey: config.get<string>('email.resendApiKey') || '',
      from: config.get<string>('email.from') || 'noreply@kskcolle.be',
    };
    
    // Initialize Resend
    if (this.config.apiKey) {
      this.resend = new Resend(this.config.apiKey);
    } else {
      logger.warn('RESEND_API_KEY not set, email service will not work');
    }
  }

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    try {
      if (!this.resend) {
        throw new Error('Resend API key not configured');
      }

      const { data: result, error } = await this.resend.emails.send({
        from: this.config.from,
        to: [data.to],
        subject: 'Wachtwoord reset - KSK Colle',
        html: this.generatePasswordResetEmailHTML(data),
        text: this.generatePasswordResetEmailText(data),
      });

      if (error) {
        throw error;
      }

      logger.info('Password reset email sent successfully', { to: data.to, id: result?.id });
    } catch (error) {
      logger.error('Failed to send password reset email', { error, to: data.to });
      throw error;
    }
  }

  async sendCustomEmail(data: CustomEmailData): Promise<void> {
    try {
      if (!this.resend) {
        throw new Error('Resend API key not configured');
      }

      const { data: result, error } = await this.resend.emails.send({
        from: this.config.from,
        to: [data.to],
        subject: data.subject,
        html: data.html,
        text: data.text,
      });

      if (error) {
        throw error;
      }

      logger.info('Custom email sent successfully', { to: data.to, subject: data.subject, id: result?.id });
    } catch (error) {
      logger.error('Failed to send custom email', { error, to: data.to, subject: data.subject });
      throw error;
    }
  }

  async sendContactFormEmail(data: ContactFormData): Promise<void> {
    try {
      if (!this.resend) {
        throw new Error('Resend API key not configured');
      }

      // Send to both email addresses
      const recipients = ['jvaerendonck@gmail.com'];
      // const recipients = ['patrick.gillis3@telenet.be', 'niels.ongena@hotmail.be'];
      
      for (const recipient of recipients) {
        const { data: result, error } = await this.resend.emails.send({
          from: this.config.from,
          to: [recipient],
          subject: 'Nieuw contactformulier - KSK Colle',
          html: this.generateContactFormEmailHTML(data),
          text: this.generateContactFormEmailText(data),
        });

        if (error) {
          throw error;
        }

        logger.info('Contact form email sent successfully', { to: recipient, id: result?.id });
      }
    } catch (error) {
      logger.error('Failed to send contact form email', { error, data });
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
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
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
              <a href="${data.resetUrl}" class="button" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Wachtwoord Resetten</a>
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

  private generateContactFormEmailHTML(data: ContactFormData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nieuw Contactformulier - KSK Colle</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; }
          .field { margin-bottom: 15px; }
          .field-label { font-weight: bold; color: #007bff; }
          .field-value { background-color: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KSK Colle</h1>
            <h2>Nieuw Contactformulier</h2>
          </div>
          
          <div class="content">
            <p>Er is een nieuw contactformulier ingevuld op de website van KSK Colle.</p>
            
            <div class="field">
              <div class="field-label">Naam:</div>
              <div class="field-value">${data.firstName} ${data.lastName}</div>
            </div>
            
            <div class="field">
              <div class="field-label">E-mail:</div>
              <div class="field-value">${data.email}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Telefoonnummer:</div>
              <div class="field-value">${data.phoneNumber}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Adres:</div>
              <div class="field-value">${data.address}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Bericht:</div>
              <div class="field-value">${data.description}</div>
            </div>
            
            <p>Neem contact op met deze persoon om verdere informatie te verstrekken over KSK Colle.</p>
          </div>
          
          <div class="footer">
            <p>Deze email is automatisch gegenereerd door het contactformulier op kskcolle.be</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateContactFormEmailText(data: ContactFormData): string {
    return `
KSK Colle - Nieuw Contactformulier

Er is een nieuw contactformulier ingevuld op de website van KSK Colle.

Naam: ${data.firstName} ${data.lastName}
E-mail: ${data.email}
Telefoonnummer: ${data.phoneNumber}
Adres: ${data.address}

Bericht:
${data.description}

Neem contact op met deze persoon om verdere informatie te verstrekken over KSK Colle.

Deze email is automatisch gegenereerd door het contactformulier op kskcolle.be
    `;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.resend) {
        return false;
      }
      
      // Test connection by trying to get domains
      await this.resend.domains.list();
      return true;
    } catch (error) {
      logger.error('Email service connection failed', { error });
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
