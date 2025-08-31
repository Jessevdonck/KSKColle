import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import * as passwordResetService from '../service/passwordResetService';
import type {
  KoaContext,
  KoaRouter,
  ChessAppState,
  ChessAppContext,
} from '../types/koa';
import { authDelay } from '../core/auth';
import * as emailService from '../service/emailService';

interface RequestPasswordResetRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * @api {post} /api/password-reset/request Request password reset
 * @apiName RequestPasswordReset
 * @apiGroup PasswordReset
 * 
 * @apiBody {String} email The email of the user requesting password reset
 * 
 * @apiSuccess {String} message Success message
 * 
 * @apiError (400) BadRequest Invalid email format
 * @apiError (500) InternalServerError Server error
 */
const requestPasswordReset = async (ctx: KoaContext<{ message: string }, void, RequestPasswordResetRequest>) => {
  const { email } = ctx.request.body;
  
  await passwordResetService.requestPasswordReset({ email });
  
  ctx.status = 200;
  ctx.body = { 
    message: 'Als het emailadres bestaat in onze database, ontvangt u een email met instructies om uw wachtwoord te resetten.' 
  };
};

requestPasswordReset.validationScheme = {
  body: {
    email: Joi.string().email().required(),
  },
};

/**
 * @api {post} /api/password-reset/reset Reset password with token
 * @apiName ResetPassword
 * @apiGroup PasswordReset
 * 
 * @apiBody {String} token The reset token from email
 * @apiBody {String} newPassword The new password
 * 
 * @apiSuccess {String} message Success message
 * 
 * @apiError (400) BadRequest Invalid or expired token, weak password
 * @apiError (500) InternalServerError Server error
 */
const resetPassword = async (ctx: KoaContext<{ message: string }, void, ResetPasswordRequest>) => {
  const { token, newPassword } = ctx.request.body;
  
  await passwordResetService.resetPassword({ token, newPassword });
  
  ctx.status = 200;
  ctx.body = { 
    message: 'Uw wachtwoord is succesvol gereset. U kunt nu inloggen met uw nieuwe wachtwoord.' 
  };
};

resetPassword.validationScheme = {
  body: {
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  },
};

/**
 * @api {get} /api/password-reset/validate/:token Validate reset token
 * @apiName ValidateResetToken
 * @apiGroup PasswordReset
 * 
 * @apiParam {String} token The reset token to validate
 * 
 * @apiSuccess {Boolean} valid Whether the token is valid
 * 
 * @apiError (500) InternalServerError Server error
 */
const validateResetToken = async (ctx: KoaContext<{ valid: boolean }, { token: string }>) => {
  const { token } = ctx.params;
  
  const isValid = await passwordResetService.validateResetToken(token);
  
  ctx.status = 200;
  ctx.body = { valid: isValid };
};

/**
 * @api {post} /api/password-reset/test-email Test email connection
 * @apiName TestEmailConnection
 * @apiGroup PasswordReset
 * 
 * @apiSuccess {String} message Success message
 * 
 * @apiError (500) InternalServerError Email service error
 */
const testEmailConnection = async (ctx: KoaContext<{ message: string; success: boolean }>) => {
  try {
    const isConnected = await emailService.verifyConnection();
    
    if (isConnected) {
      ctx.status = 200;
      ctx.body = { 
        message: 'Email service verbinding succesvol',
        success: true
      };
    } else {
      ctx.status = 500;
      ctx.body = { 
        message: 'Email service verbinding mislukt',
        success: false
      };
    }
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = { 
      message: `Email service fout: ${error.message || 'Onbekende fout'}`,
      success: false
    };
  }
};

export default function installPasswordResetRouter(parent: KoaRouter) {
  const router = new Router<ChessAppState, ChessAppContext>({
    prefix: '/password-reset',
  });

  router.post('/request', authDelay, validate(requestPasswordReset.validationScheme), requestPasswordReset);
  router.post('/reset', authDelay, validate(resetPassword.validationScheme), resetPassword);
  router.get('/validate/:token', validateResetToken);
  router.post('/test-email', testEmailConnection);

  parent.use(router.routes()).use(router.allowedMethods());
}
