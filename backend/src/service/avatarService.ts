import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function updateUserAvatar(userId: number, avatarUrl: string) {
  try {
    const user = await prisma.user.update({
      where: { user_id: userId },
      data: { avatar_url: avatarUrl },
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
      // Delete file from filesystem
      const filePath = path.join(process.cwd(), 'public', user.avatar_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
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
