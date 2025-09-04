import { PrismaClient } from '@prisma/client';
import * as cloudinaryService from './cloudinaryService';

const prisma = new PrismaClient();

export async function updateUserAvatar(userId: number, fileBuffer: Buffer, originalName: string) {
  try {
    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { avatar_url: true }
    });

    // Delete old avatar from Cloudinary if it exists
    if (currentUser?.avatar_url) {
      const publicId = cloudinaryService.getPublicIdFromUrl(currentUser.avatar_url);
      if (publicId) {
        try {
          await cloudinaryService.deleteAvatar(publicId);
        } catch (error) {
          console.error('Failed to delete old avatar from Cloudinary:', error);
          // Continue with upload even if delete fails
        }
      }
    }

    // Upload new avatar to Cloudinary
    const uploadResult = await cloudinaryService.uploadAvatar(fileBuffer, userId, originalName);

    // Update user with new avatar URL
    const user = await prisma.user.update({
      where: { user_id: userId },
      data: { avatar_url: uploadResult.secure_url },
      select: {
        user_id: true,
        voornaam: true,
        achternaam: true,
        email: true,
        avatar_url: true,
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error updating user avatar:', error);
    throw new Error('Failed to update avatar');
  }
}

export async function deleteUserAvatar(userId: number) {
  try {
    // Get current avatar URL
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { avatar_url: true }
    });

    if (user?.avatar_url) {
      // Delete from Cloudinary
      const publicId = cloudinaryService.getPublicIdFromUrl(user.avatar_url);
      if (publicId) {
        try {
          await cloudinaryService.deleteAvatar(publicId);
        } catch (error) {
          console.error('Failed to delete avatar from Cloudinary:', error);
          // Continue with database update even if Cloudinary delete fails
        }
      }
    }

    // Update database
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: { avatar_url: null },
      select: {
        user_id: true,
        voornaam: true,
        achternaam: true,
        email: true,
        avatar_url: true,
      }
    });

    return updatedUser;
  } catch (error) {
    console.error('Error deleting user avatar:', error);
    throw new Error('Failed to delete avatar');
  }
}

export async function getUserAvatar(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { avatar_url: true }
    });

    return user?.avatar_url || null;
  } catch (error) {
    console.error('Error getting user avatar:', error);
    throw new Error('Failed to get avatar');
  }
}
