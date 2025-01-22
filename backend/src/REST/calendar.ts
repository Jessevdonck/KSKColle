import Router from '@koa/router';
import * as eventService from '../service/calendarService';
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa';
import type { IdParams } from '../types/common';
import Joi from 'joi';
import validate from '../core/validation';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import Role from '../core/roles';
import { CreateEventRequest, CreateEventResponse, GetAllEventResponse, GetEventByIdResponse, UpdateEventRequest, UpdateEventResponse } from '../types/calendar';


const getAllEvents = async (ctx: KoaContext<GetAllEventResponse>) => {
  const events =  await eventService.getAllEvents();
  ctx.body = {
    items: events,
  };
};

getAllEvents.validationScheme = null;

const createEvent = async (ctx: KoaContext<CreateEventResponse, void, CreateEventRequest>) => {
  const newEvent: any = await eventService.createEvent(ctx.request.body);
  ctx.status = 201; 
  ctx.body = newEvent;
};

createEvent.validationScheme = {
  body: {
    title: Joi.string(),
    description: Joi.string().allow(null),
    type: Joi.string(),
    date: Joi.date(),
  },
};

const getEventById = async (ctx: KoaContext<GetEventByIdResponse, IdParams>) => {
  ctx.body = await eventService.getEventById(Number(ctx.params.id));
};

getEventById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

const updateEvent = async (ctx: KoaContext<UpdateEventResponse, IdParams, UpdateEventRequest>) => {
  const spelId = Number(ctx.params.id); 
  const updatedSpeler = await eventService.updateEvent(spelId, ctx.request.body); 
  
  ctx.body = updatedSpeler; 
};

updateEvent.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
  body: {
    result: Joi.string().required(), 
  },
};

const removeEvent = async (ctx: KoaContext<void, IdParams>) => {
  const spelId = Number(ctx.params.id);
  eventService.removeEvent(spelId);
  ctx.status = 204; 
};

removeEvent.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/calendar',
  });

  const requireAdmin = makeRequireRole(Role.ADMIN);

  router.get('/', validate(getAllEvents.validationScheme), getAllEvents);
  router.get('/:id', validate(getEventById.validationScheme), getEventById);
  router.post('/', requireAuthentication, requireAdmin, validate(createEvent.validationScheme), createEvent);
  router.put('/:id', requireAuthentication, requireAdmin, validate(updateEvent.validationScheme), updateEvent);
  router.delete('/:id', requireAuthentication, requireAdmin, validate(removeEvent.validationScheme), removeEvent);

  parent.use(router.routes()).use(router.allowedMethods());
};