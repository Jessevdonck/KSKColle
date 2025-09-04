import Router from '@koa/router';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ChessAppContext, ChessAppState } from '../types/koa';
import { requireAuthentication } from '../core/auth';
import * as avatarService from '../service/avatarService';
import { ServiceError } from '../core/serviceError';

const router = new Router({ prefix: '/avatar' });

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `avatar_${timestamp}_${randomString}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/avatar/upload
 * Upload a new avatar for the authenticated user
 */
const uploadAvatar = async (ctx: any) => {
  try {
    const userId = ctx.state.session.userId;
    
    // Handle single file upload
    const uploadSingle = upload.single('avatar');
    
    await new Promise((resolve, reject) => {
      uploadSingle(ctx.req, ctx.res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });

    if (!ctx.req.file) {
      throw new ServiceError('No file uploaded', 400);
    }

    // Delete old avatar if exists
    const currentAvatarUrl = await avatarService.getUserAvatar(userId);
    if (currentAvatarUrl) {
      const oldFilePath = path.join(process.cwd(), 'public', currentAvatarUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update user with new avatar URL
    const avatarUrl = `/uploads/avatars/${ctx.req.file.filename}`;
    const updatedUser = await avatarService.updateUserAvatar(userId, avatarUrl);

    ctx.body = {
      success: true,
      message: 'Avatar uploaded successfully',
      user: updatedUser,
      avatarUrl
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    
    if (error instanceof ServiceError) {
      ctx.status = error.statusCode;
      ctx.body = { success: false, message: error.message };
    } else if (error.code === 'LIMIT_FILE_SIZE') {
      ctx.status = 400;
      ctx.body = { success: false, message: 'File too large. Maximum size is 5MB.' };
    } else {
      ctx.status = 500;
      ctx.body = { success: false, message: 'Failed to upload avatar' };
    }
  }
};
uploadAvatar.validationScheme = null;

/**
 * DELETE /api/avatar
 * Delete the current user's avatar
 */
const deleteAvatar = async (ctx: any) => {
  try {
    const userId = ctx.state.session.userId;
    const updatedUser = await avatarService.deleteUserAvatar(userId);

    ctx.body = {
      success: true,
      message: 'Avatar deleted successfully',
      user: updatedUser
    };
  } catch (error) {
    console.error('Avatar delete error:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: 'Failed to delete avatar' };
  }
};
deleteAvatar.validationScheme = null;

/**
 * GET /api/avatar/:userId
 * Get avatar URL for a specific user
 */
const getUserAvatar = async (ctx: any) => {
  try {
    const userId = parseInt(ctx.params.userId);
    const avatarUrl = await avatarService.getUserAvatar(userId);

    ctx.body = {
      success: true,
      avatarUrl
    };
  } catch (error) {
    console.error('Get avatar error:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: 'Failed to get avatar' };
  }
};
getUserAvatar.validationScheme = null;

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  router
    .post('/upload', requireAuthentication, uploadAvatar)
    .delete('/', requireAuthentication, deleteAvatar)
    .get('/:userId', getUserAvatar);

  parent.use(router.routes()).use(router.allowedMethods());
};
