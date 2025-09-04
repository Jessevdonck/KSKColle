import Router from '@koa/router';
import multer from 'multer';
import { ChessAppContext, ChessAppState } from '../types/koa';
import { requireAuthentication } from '../core/auth';
import * as avatarService from '../service/avatarService';
import ServiceError from '../core/serviceError';

const router = new Router({ prefix: '/avatar' });

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Only image files are allowed') as any;
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
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
      throw ServiceError.validationFailed('No file uploaded');
    }

    // Upload to Cloudinary and update user
    const updatedUser = await avatarService.updateUserAvatar(
      userId, 
      ctx.req.file.buffer, 
      ctx.req.file.originalname
    );

    ctx.body = {
      success: true,
      message: 'Avatar uploaded successfully',
      user: updatedUser,
      avatarUrl: updatedUser.avatar_url
    };
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    
    if (error instanceof ServiceError) {
      ctx.status = 400;
      ctx.body = { success: false, message: error.message };
    } else if (error?.code === 'LIMIT_FILE_SIZE') {
      ctx.status = 400;
      ctx.body = { success: false, message: 'File too large. Maximum size is 5MB.' };
    } else if (error?.code === 'INVALID_FILE_TYPE') {
      ctx.status = 400;
      ctx.body = { success: false, message: 'Only image files are allowed.' };
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
  } catch (error: any) {
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
  } catch (error: any) {
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
