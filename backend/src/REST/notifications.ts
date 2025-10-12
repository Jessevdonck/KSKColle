import Router from '@koa/router'
import Joi from 'joi'
import * as notificationService from '../service/notificationService'
import { requireAuthentication } from '../core/auth'
import validate from '../core/validation'
import type { ChessAppState, ChessAppContext, KoaContext } from '../types/koa'
import { getLogger } from '../core/logging'

const logger = getLogger()

/**
 * @api {get} /notifications Get user notifications
 * @apiName GetNotifications
 * @apiGroup Notifications
 * @apiPermission authenticated
 * 
 * @apiQuery {Number} [limit=20] Number of notifications to return
 * @apiQuery {Number} [offset=0] Number of notifications to skip
 * @apiQuery {Boolean} [unread_only=false] Only return unread notifications
 * 
 * @apiSuccess (200) {Object} response Notifications with pagination info
 */
const getNotifications = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId

  try {
    const limit = parseInt(ctx.query.limit as string) || 20
    const offset = parseInt(ctx.query.offset as string) || 0
    const unreadOnly = ctx.query.unread_only === 'true'

    const request = {
      user_id: userId,
      limit,
      offset,
      unread_only: unreadOnly,
    }

    const response = await notificationService.getNotificationsByUserId(request)
    
    ctx.body = response
  } catch (error) {
    logger.error('Failed to get notifications', { error, userId })
    ctx.throw(500, 'Failed to get notifications')
  }
}
getNotifications.validationScheme = {
  query: {
    limit: Joi.number().integer().min(1).max(100).optional(),
    offset: Joi.number().integer().min(0).optional(),
    unread_only: Joi.boolean().optional(),
  }
}

/**
 * @api {put} /notifications/:id/read Mark notification as read
 * @apiName MarkNotificationAsRead
 * @apiGroup Notifications
 * @apiPermission authenticated
 * 
 * @apiParam {Number} id Notification ID
 * 
 * @apiSuccess (204) NoContent Notification marked as read
 * @apiError (404) NotFound Notification not found
 */
const markNotificationAsRead = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId
  const notificationId = parseInt((ctx.params as { id: string }).id)

  try {
    await notificationService.markNotificationAsRead(notificationId, userId)
    ctx.status = 204
  } catch (error) {
    logger.error('Failed to mark notification as read', { error, userId, notificationId })
    ctx.throw(500, 'Failed to mark notification as read')
  }
}
markNotificationAsRead.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  }
}

/**
 * @api {put} /notifications/read-all Mark all notifications as read
 * @apiName MarkAllNotificationsAsRead
 * @apiGroup Notifications
 * @apiPermission authenticated
 * 
 * @apiSuccess (204) NoContent All notifications marked as read
 */
const markAllNotificationsAsRead = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId

  try {
    await notificationService.markAllNotificationsAsRead(userId)
    ctx.status = 204
  } catch (error) {
    logger.error('Failed to mark all notifications as read', { error, userId })
    ctx.throw(500, 'Failed to mark all notifications as read')
  }
}
markAllNotificationsAsRead.validationScheme = null

/**
 * @api {delete} /notifications/:id Delete notification
 * @apiName DeleteNotification
 * @apiGroup Notifications
 * @apiPermission authenticated
 * 
 * @apiParam {Number} id Notification ID
 * 
 * @apiSuccess (204) NoContent Notification deleted
 * @apiError (404) NotFound Notification not found
 */
const deleteNotification = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId
  const notificationId = parseInt((ctx.params as { id: string }).id)

  try {
    await notificationService.deleteNotification(notificationId, userId)
    ctx.status = 204
  } catch (error) {
    logger.error('Failed to delete notification', { error, userId, notificationId })
    ctx.throw(500, 'Failed to delete notification')
  }
}
deleteNotification.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  }
}

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/notifications',
  })

  // Require authentication for all notification operations
  const requireAuth = requireAuthentication

  // Authenticated routes
  router.get('/', requireAuth, validate(getNotifications.validationScheme), getNotifications)
  router.put('/:id/read', requireAuth, validate(markNotificationAsRead.validationScheme), markNotificationAsRead)
  router.put('/read-all', requireAuth, validate(markAllNotificationsAsRead.validationScheme), markAllNotificationsAsRead)
  router.delete('/:id', requireAuth, validate(deleteNotification.validationScheme), deleteNotification)

  parent.use(router.routes()).use(router.allowedMethods())
}
