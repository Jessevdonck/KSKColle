import Router from '@koa/router'
import Joi from 'joi'
import * as commentService from '../service/commentService'
import { requireAuthentication } from '../core/auth'
import validate from '../core/validation'
import type { ChessAppState, ChessAppContext, KoaContext } from '../types/koa'
import { getLogger } from '../core/logging'

const logger = getLogger()

/**
 * @api {post} /comments Create a new comment
 * @apiName CreateComment
 * @apiGroup Comments
 * @apiPermission user,bestuurslid,admin (exlid users cannot comment)
 * 
 * @apiParam {Number} article_id Article ID
 * @apiParam {String} content Comment content
 * 
 * @apiSuccess (201) {Object} comment Created comment with author info
 * @apiError (401) Unauthorized Authentication required
 * @apiError (403) Forbidden Insufficient permissions (exlid users cannot comment)
 * @apiError (400) BadRequest Invalid input data
 */
const createComment = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId
  const userRoles = ctx.state.session.roles || []
  
  // Check if user has permission to comment (user, bestuurslid, or admin)
  const canComment = userRoles.includes('user') || userRoles.includes('bestuurslid') || userRoles.includes('admin')
  
  if (!canComment) {
    ctx.status = 403
    ctx.body = { error: 'Only active members can post comments' }
    return
  }

  try {
    const commentData = {
      article_id: (ctx.request.body as any).article_id,
      content: (ctx.request.body as any).content,
    }

    const comment = await commentService.createComment(userId, commentData)
    
    ctx.status = 201
    ctx.body = comment
  } catch (error) {
    logger.error('Failed to create comment', { error, userId })
    ctx.throw(500, 'Failed to create comment')
  }
}
createComment.validationScheme = {
  body: {
    article_id: Joi.number().integer().positive().required(),
    content: Joi.string().min(1).required(),
  }
}

/**
 * @api {get} /comments/:articleId Get comments for an article
 * @apiName GetComments
 * @apiGroup Comments
 * @apiPermission public
 * 
 * @apiParam {Number} articleId Article ID
 * @apiQuery {Number} [limit=20] Number of comments to return
 * @apiQuery {Number} [offset=0] Number of comments to skip
 * 
 * @apiSuccess (200) {Object} response Comments with pagination info
 * @apiError (400) BadRequest Invalid article ID
 */
const getComments = async (ctx: KoaContext) => {
  try {
    const articleId = parseInt((ctx.params as { articleId: string }).articleId)
    const limit = parseInt(ctx.query.limit as string) || 20
    const offset = parseInt(ctx.query.offset as string) || 0

    const request = {
      article_id: articleId,
      limit,
      offset,
    }

    const response = await commentService.getCommentsByArticleId(request)
    
    ctx.body = response
  } catch (error) {
    logger.error('Failed to get comments', { error })
    ctx.throw(500, 'Failed to get comments')
  }
}
getComments.validationScheme = {
  params: {
    articleId: Joi.number().integer().positive().required(),
  },
  query: {
    limit: Joi.number().integer().min(1).max(100).optional(),
    offset: Joi.number().integer().min(0).optional(),
  }
}

/**
 * @api {put} /comments/:id Update a comment
 * @apiName UpdateComment
 * @apiGroup Comments
 * @apiPermission comment owner
 * 
 * @apiParam {Number} id Comment ID
 * @apiParam {String} content Updated comment content
 * 
 * @apiSuccess (200) {Object} comment Updated comment with author info
 * @apiError (401) Unauthorized Authentication required
 * @apiError (403) Forbidden You can only edit your own comments
 * @apiError (404) NotFound Comment not found
 */
const updateComment = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId
  const commentId = parseInt((ctx.params as { id: string }).id)

  try {
    const commentData = {
      content: (ctx.request.body as any).content,
    }

    const comment = await commentService.updateComment(commentId, userId, commentData)
    
    ctx.body = comment
  } catch (error: any) {
    if (error.message === 'Comment not found or you do not have permission to edit it') {
      ctx.status = 403
      ctx.body = { error: 'You can only edit your own comments' }
      return
    }
    
    logger.error('Failed to update comment', { error, userId, commentId })
    ctx.throw(500, 'Failed to update comment')
  }
}
updateComment.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
  body: {
    content: Joi.string().min(1).required(),
  }
}

/**
 * @api {delete} /comments/:id Delete a comment
 * @apiName DeleteComment
 * @apiGroup Comments
 * @apiPermission comment owner or admin
 * 
 * @apiParam {Number} id Comment ID
 * 
 * @apiSuccess (204) NoContent Comment deleted successfully
 * @apiError (401) Unauthorized Authentication required
 * @apiError (403) Forbidden You can only delete your own comments
 * @apiError (404) NotFound Comment not found
 */
const deleteComment = async (ctx: KoaContext) => {
  const userId = ctx.state.session.userId
  const userRoles = ctx.state.session.roles || []
  const commentId = parseInt((ctx.params as { id: string }).id)

  try {
    await commentService.deleteComment(commentId, userId, userRoles)
    ctx.status = 204
  } catch (error: any) {
    if (error.message === 'Comment not found') {
      ctx.status = 404
      ctx.body = { error: 'Comment not found' }
      return
    }
    
    if (error.message === 'You do not have permission to delete this comment') {
      ctx.status = 403
      ctx.body = { error: 'You can only delete your own comments' }
      return
    }
    
    logger.error('Failed to delete comment', { error, userId, commentId })
    ctx.throw(500, 'Failed to delete comment')
  }
}
deleteComment.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  }
}

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/comments',
  })

  // Require authentication for all comment operations
  const requireAuth = requireAuthentication

  // Public routes
  router.get('/:articleId', validate(getComments.validationScheme), getComments)

  // Authenticated routes
  router.post('/', requireAuth, validate(createComment.validationScheme), createComment)
  router.put('/:id', requireAuth, validate(updateComment.validationScheme), updateComment)
  router.delete('/:id', requireAuth, validate(deleteComment.validationScheme), deleteComment)

  parent.use(router.routes()).use(router.allowedMethods())
}
