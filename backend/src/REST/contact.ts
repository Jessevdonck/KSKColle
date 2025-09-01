import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import { emailService } from '../service/emailService';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';

interface ContactFormRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  description: string;
}

/**
 * @api {post} /api/contact Submit contact form
 * @apiName SubmitContactForm
 * @apiGroup Contact
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
    address: Joi.string().required().min(1).max(500),
    description: Joi.string().required().min(1).max(2000),
  },
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/contact',
  });

  router.post('/', validate(submitContactForm.validationScheme), submitContactForm);

  parent.use(router.routes()).use(router.allowedMethods());
};
