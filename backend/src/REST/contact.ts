import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import { emailService } from '../service/emailService';
import { requireAuthentication } from '../core/auth';
import { createRateLimiter } from '../core/rateLimit';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';

// Beperkt misbruik van het contactformulier (verstuurt mails via Resend,
// waarvan de dagelijkse limiet snel bereikt is bij herhaaldelijk misbruik).
const contactRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: (ctx) => `contact:${ctx.state.session.userId}:${ctx.ip}`,
  message: 'Je hebt het contactformulier te vaak gebruikt. Probeer het later opnieuw.',
});

interface ContactFormRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  description: string;
}

/**
 * @api {post} /api/contact Submit contact form
 * @apiName SubmitContactForm
 * @apiGroup Contact
 * @apiPermission authenticated
 *
 * @apiBody {String} firstName First name of the person
 * @apiBody {String} lastName Last name of the person
 * @apiBody {String} email Email address of the person
 * @apiBody {String} phoneNumber Phone number of the person
 * @apiBody {String} address Address of the person
 * @apiBody {String} description Message content
 *
 * @apiSuccess {String} message Success message
 * @apiError (400) BadRequest Invalid data provided.
 * @apiError (401) Unauthorized You need to be authenticated to access this resource.
 * @apiError (429) TooManyRequests Rate limit exceeded.
 * @apiError (500) InternalServerError Email sending failed.
 */

const submitContactForm = async (ctx: KoaContext<{ message: string }, void, ContactFormRequest>) => {
  try {
    const formData = ctx.request.body;
    
    // Send email to both recipients
    await emailService.sendContactFormEmail(formData);
    
    ctx.status = 200;
    ctx.body = { 
      message: 'Contactformulier succesvol verzonden! We nemen zo snel mogelijk contact met je op.' 
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { 
      message: 'Er is een fout opgetreden bij het verzenden van het contactformulier. Probeer het later opnieuw.' 
    };
  }
};

submitContactForm.validationScheme = {
  body: {
    firstName: Joi.string().required().min(1).max(100),
    lastName: Joi.string().required().min(1).max(100),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required().min(1).max(20),
    address: Joi.string().optional().allow('').max(500),
    description: Joi.string().required().min(1).max(2000),
  },
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/contact',
  });

  router.post('/', requireAuthentication, contactRateLimiter, validate(submitContactForm.validationScheme), submitContactForm);

  parent.use(router.routes()).use(router.allowedMethods());
};
