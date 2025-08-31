import { prisma } from "./data";
import { hashPassword } from "../core/password";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";
import emailService from "./emailService";

import { getLogger } from "../core/logging";

const logger = getLogger();

interface GeneratePasswordData {
  userId: number;
  adminUserId: number;
}

interface CreateUserWithPasswordData {
  userData: {
    voornaam: string;
    achternaam: string;
    email: string;
    geboortedatum: Date;
    tel_nummer: string;
    vast_nummer?: string;
    schaakrating_elo?: number;
    is_admin?: boolean;
    is_youth?: boolean;
    fide_id?: number;
    lid_sinds: Date;
    adres_straat?: string;
    adres_nummer?: string;
    adres_bus?: string;
    adres_postcode?: string;
    adres_gemeente?: string;
    adres_land?: string;
  };
  adminUserId: number;
}

/**
 * Genereer een veilig wachtwoord van 12 karakters
 * Bevat hoofdletters, kleine letters, cijfers en symbolen
 */
function generateSecurePassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';
  
  // Zorg ervoor dat elk type karakter minstens één keer voorkomt
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Vul aan tot 12 karakters
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle de karakters
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Stuur wachtwoord email naar gebruiker
 */
async function sendPasswordEmail(userId: number, password: string, isNewUser: boolean = false): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        voornaam: true,
        achternaam: true,
        email: true,
      },
    });

    if (!user) {
      throw ServiceError.notFound('Gebruiker niet gevonden');
    }

    const subject = isNewUser 
      ? 'Welkom bij KSK Colle - Je account gegevens'
      : 'Wachtwoord Reset - KSK Colle';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; }
          .password-box { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 18px; text-align: center; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KSK Colle</h1>
            <h2>${isNewUser ? 'Welkom!' : 'Wachtwoord Reset'}</h2>
          </div>
          
          <div class="content">
            <p>Beste ${user.voornaam} ${user.achternaam},</p>
            
            ${isNewUser 
              ? '<p>Welkom bij KSK Colle! Je account is succesvol aangemaakt.</p>'
              : '<p>Je wachtwoord is succesvol gereset door een administrator.</p>'
            }
            
            <p>Hier zijn je inloggegevens:</p>
            
            <div class="password-box">
              <strong>Email:</strong> ${user.email}<br>
              <strong>Wachtwoord:</strong> ${password}
            </div>
            
            <div class="warning">
              <strong>Belangrijk:</strong>
              <ul>
                <li>Bewaar je wachtwoord op een veilige plek</li>
                <li>Verander je wachtwoord na je eerste login</li>
                <li>Deel je wachtwoord niet met anderen</li>
                ${isNewUser ? '<li>Je kunt nu inloggen op <a href="http://localhost:3001">http://localhost:3001</a></li>' : ''}
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

    const textContent = `
KSK Colle - ${subject}

Beste ${user.voornaam} ${user.achternaam},

${isNewUser 
  ? 'Welkom bij KSK Colle! Je account is succesvol aangemaakt.'
  : 'Je wachtwoord is succesvol gereset door een administrator.'
}

Hier zijn je inloggegevens:
Email: ${user.email}
Wachtwoord: ${password}

Belangrijk:
- Bewaar je wachtwoord op een veilige plek
- Verander je wachtwoord na je eerste login
- Deel je wachtwoord niet met anderen
${isNewUser ? '- Je kunt nu inloggen op https://kskcolle.be/' : ''}

Met vriendelijke groet,
Het KSK Colle Team

Deze email is automatisch gegenereerd. Reageer niet op deze email.
    `;

    await emailService.sendCustomEmail({
      to: user.email,
      subject: subject,
      html: htmlContent,
      text: textContent,
    });

    logger.info('Password email sent successfully', { 
      userId, 
      email: user.email, 
      isNewUser 
    });
  } catch (error) {
    logger.error('Failed to send password email', { error, userId });
    throw error;
  }
}

/**
 * Genereer nieuw wachtwoord voor bestaande gebruiker
 */
export const generateNewPassword = async (data: GeneratePasswordData): Promise<void> => {
  try {
    // Controleer of gebruiker bestaat
    const user = await prisma.user.findUnique({
      where: { user_id: data.userId },
    });

    if (!user) {
      throw ServiceError.notFound('Gebruiker niet gevonden');
    }

    // Genereer nieuw wachtwoord
    const newPassword = generateSecurePassword();
    
    // Hash het wachtwoord
    const passwordHash = await hashPassword(newPassword);

    // Update wachtwoord in database
    await prisma.user.update({
      where: { user_id: data.userId },
      data: { password_hash: passwordHash },
    });

    // Stuur email met nieuw wachtwoord
    await sendPasswordEmail(data.userId, newPassword, false);

    logger.info('New password generated successfully', { 
      userId: data.userId, 
      adminUserId: data.adminUserId 
    });
  } catch (error) {
    logger.error('Failed to generate new password', { error, data });
    throw handleDBError(error);
  }
};

/**
 * Maak nieuwe gebruiker aan met gegenereerd wachtwoord
 */
export const createUserWithGeneratedPassword = async (data: CreateUserWithPasswordData): Promise<number> => {
  try {
    // Controleer of email al bestaat
    const existingUser = await prisma.user.findUnique({
      where: { email: data.userData.email },
    });

    if (existingUser) {
      throw ServiceError.conflict('Een gebruiker met dit emailadres bestaat al');
    }

    // Genereer wachtwoord
    const password = generateSecurePassword();
    const passwordHash = await hashPassword(password);

    // Bepaal rollen
    const roles = data.userData.is_admin ? ['user', 'admin'] : ['user'];

    // Maak gebruiker aan
    const newUser = await prisma.user.create({
      data: {
        ...data.userData,
        password_hash: passwordHash,
        roles: JSON.stringify(roles),
        schaakrating_elo: data.userData.schaakrating_elo ?? 0,
        lid_sinds: data.userData.lid_sinds ?? new Date(),
        adres_land: data.userData.adres_land ?? 'Belgium',
      },
    });

    // Stuur email met wachtwoord
    await sendPasswordEmail(newUser.user_id, password, true);

    logger.info('User created with generated password', { 
      userId: newUser.user_id, 
      adminUserId: data.adminUserId 
    });

    return newUser.user_id;
  } catch (error) {
    logger.error('Failed to create user with generated password', { error, data });
    throw handleDBError(error);
  }
};
