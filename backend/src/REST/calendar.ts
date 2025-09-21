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
  const isYouth = ctx.query.is_youth === 'true' ? true : ctx.query.is_youth === 'false' ? false : undefined;
  const showArchive = ctx.query.show_archive === 'true' ? true : ctx.query.show_archive === 'false' ? false : undefined;
  const events = await eventService.getAllEvents(isYouth, showArchive);
  ctx.body = {
    items: events,
  };
};

getAllEvents.validationScheme = {
  query: {
    is_youth: Joi.boolean().optional(),
    show_archive: Joi.boolean().optional(),
  },
};

const createEvent = async (ctx: KoaContext<CreateEventResponse, void, CreateEventRequest>) => {
  const newEvent: any = await eventService.createEvent(ctx.request.body);
  ctx.status = 201; 
  ctx.body = newEvent;
};

createEvent.validationScheme = {
  body: {
    title: Joi.string().required(),
    description: Joi.string().optional().allow(''),
    type: Joi.string().optional().allow(''),
    date: Joi.alternatives().try(Joi.date(), Joi.string().isoDate()).required(),
    startuur: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default("20:00"),
    is_youth: Joi.boolean().optional().default(false),
    category: Joi.string().optional().allow(''),
    instructors: Joi.string().optional().allow(''),
    begeleider: Joi.string().optional().allow(''),
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
  const eventId = Number(ctx.params.id); 
  const updatedEvent = await eventService.updateEvent(eventId, ctx.request.body); 
  
  ctx.body = updatedEvent; 
};

updateEvent.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    title: Joi.string().optional(),
    description: Joi.string().optional().allow(''),
    type: Joi.string().optional().allow(''),
    date: Joi.alternatives().try(Joi.date(), Joi.string().isoDate()).optional(),
    startuur: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    is_youth: Joi.boolean().optional(),
    category: Joi.string().optional().allow(''),
    instructors: Joi.string().optional().allow(''),
    begeleider: Joi.string().optional().allow(''),
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