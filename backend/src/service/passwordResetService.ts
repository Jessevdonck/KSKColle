import { prisma } from "./data";
import { hashPassword } from "../core/password";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";
import emailService from "./emailService";
import config from "config";
import crypto from "crypto";
import { getLogger } from "../core/logging";

const logger = getLogger();

interface RequestPasswordResetData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  newPassword: string;
}



export const requestPasswordReset = async (data: RequestPasswordResetData): Promise<void> => {
  try {
    // Zoek gebruiker op email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        user_id: true,
        voornaam: true,
        achternaam: true,
        email: true,
      },
    });

    if (!user) {
      // Voor veiligheid: geef geen foutmelding als email niet bestaat
      logger.info('Password reset requested for non-existent email', { email: data.email });
      return;
    }

    // Verwijder bestaande ongebruikte tokens voor deze gebruiker
    await prisma.passwordResetToken.deleteMany({
      where: {
        user_id: user.user_id,
        used: false,
      },
    });

    // Genereer nieuwe token
    const token = crypto.randomBytes(config.get<number>('passwordReset.tokenLength')).toString('hex');
    const expiryHours = config.get<number>('passwordReset.tokenExpiryHours');
    const expires = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // Sla token op in database
    await prisma.passwordResetToken.create({
      data: {
        user_id: user.user_id,
        token,
        expires,
        used: false,
      },
    });

    // Stuur email
    const resetUrl = `${process.env.FRONTEND_URL || 'kskcolle.be'}/reset-password?token=${token}`;
    
    await emailService.sendPasswordResetEmail({
      to: user.email,
      resetToken: token,
      userName: `${user.voornaam} ${user.achternaam}`,
      resetUrl,
    });

    logger.info('Password reset email sent successfully', { userId: user.user_id, email: user.email });
  } catch (error) {
    logger.error('Failed to request password reset', { error, email: data.email });
    throw handleDBError(error);
  }
};

export const resetPassword = async (data: ResetPasswordData): Promise<void> => {
  try {
    // Zoek token in database
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: data.token },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw ServiceError.validationFailed('Ongeldige of verlopen reset link');
    }

    // Controleer of token al gebruikt is
    if (tokenRecord.used) {
      throw ServiceError.validationFailed('Deze reset link is al gebruikt');
    }

    // Controleer of token verlopen is
    if (tokenRecord.expires < new Date()) {
      throw ServiceError.validationFailed('Deze reset link is verlopen');
    }

    // Trim trailing spaces from password and hash
    const trimmedNewPassword = data.newPassword.trim();
    const newPasswordHash = await hashPassword(trimmedNewPassword);

    // Update wachtwoord in database
    await prisma.user.update({
      where: { user_id: tokenRecord.user_id },
      data: { password_hash: newPasswordHash },
    });

    // Markeer token als gebruikt
    await prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    });

    // Verwijder alle andere tokens voor deze gebruiker
    await prisma.passwordResetToken.deleteMany({
      where: {
        user_id: tokenRecord.user_id,
        id: { not: tokenRecord.id },
      },
    });

    logger.info('Password reset completed successfully', { userId: tokenRecord.user_id });
  } catch (error) {
    logger.error('Failed to reset password', { error, token: data.token });
    throw handleDBError(error);
  }
};

export const validateResetToken = async (token: string): Promise<boolean> => {
  try {
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      return false;
    }

    if (tokenRecord.used) {
      return false;
    }

    if (tokenRecord.expires < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to validate reset token', { error, token });
    return false;
  }
};

export const cleanupExpiredTokens = async (): Promise<void> => {
  try {
    const deletedCount = await prisma.passwordResetToken.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });

    if (deletedCount.count > 0) {
      logger.info('Cleaned up expired password reset tokens', { count: deletedCount.count });
    }
  } catch (error) {
    logger.error('Failed to cleanup expired tokens', { error });
  }
};
