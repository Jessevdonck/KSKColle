import Router from '@koa/router'
import { 
  getArticles as getArticlesService, 
  getRecentArticles as getRecentArticlesService, 
  getArticleById as getArticleByIdService, 
  createArticle as createArticleService, 
  updateArticle as updateArticleService, 
  deleteArticle as deleteArticleService 
} from '../service/articleService'
import { requireAuthentication, makeRequireRole } from '../core/auth'
import validate from '../core/validation'
import Joi from 'joi'
import { PrismaClient } from '@prisma/client'
import type { ChessAppContext, ChessAppState, KoaContext } from '../types/koa'
import type { 
  CreateArticleRequest, 
  UpdateArticleRequest, 
  GetArticlesResponse,
  ArticleWithAuthor,
  ArticleType 
} from '../types/article'

const prisma = new PrismaClient()

/**
 * @api {get} /articles Get articles with pagination and filters
 * @apiName GetArticles
 * @apiGroup Articles
 * 
 * @apiQuery {Number} [page=1] Page number
 * @apiQuery {Number} [pageSize=10] Number of articles per page
 * @apiQuery {String} [type] Filter by article type (NEWS, TOURNAMENT_REPORT, GENERAL)
 * @apiQuery {Boolean} [published] Filter by published status
 * @apiQuery {Boolean} [featured] Filter by featured status
 * @apiQuery {Number} [author_id] Filter by author ID
 * 
 * @apiSuccess {Object} response Response object with articles and pagination info
 * @apiSuccess {Array} response.items Array of articles
 * @apiSuccess {Number} response.total Total number of articles
 * @apiSuccess {Number} response.page Current page
 * @apiSuccess {Number} response.pageSize Page size
 * @apiSuccess {Number} response.totalPages Total number of pages
 */
const getArticles = async (ctx: KoaContext<GetArticlesResponse>) => {
  const params: any = {
    page: ctx.query.page ? parseInt(ctx.query.page as string) : undefined,
    pageSize: ctx.query.pageSize ? parseInt(ctx.query.pageSize as string) : undefined,
    type: ctx.query.type as ArticleType,
    published: ctx.query.published ? ctx.query.published === 'true' : undefined,
    featured: ctx.query.featured ? ctx.query.featured === 'true' : undefined,
    author_id: ctx.query.author_id ? parseInt(ctx.query.author_id as string) : undefined,
  }

  // If user is authenticated, check their role
  // Only admins and bestuursleden can see all drafts
  // Other users can only see their own drafts or published articles
  if (ctx.state && ctx.state.session) {
    const userId = ctx.state.session.userId
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { roles: true, is_admin: true }
    })
    
    const isAdmin = user?.is_admin || user?.roles?.includes('admin')
    const isBestuurslid = user?.roles?.includes('bestuurslid')
    
    // If not admin or bestuurslid and requesting drafts, only show own drafts
    if (!isAdmin && !isBestuurslid && params.published === false) {
      params.author_id = userId
    }
  } else {
    // Not authenticated - only show published articles
    if (params.published === undefined) {
      params.published = true
    }
  }

  const result = await getArticlesService(params)
  ctx.body = result
}
getArticles.validationScheme = {
  query: {
    page: Joi.number().integer().min(1).optional(),
    pageSize: Joi.number().integer().min(1).max(100).optional(),
    type: Joi.string().valid('NEWS', 'TOURNAMENT_REPORT', 'GENERAL').optional(),
    published: Joi.boolean().optional(),
    featured: Joi.boolean().optional(),
    author_id: Joi.number().integer().positive().optional(),
  }
}

/**
 * @api {get} /articles/recent Get recent published articles
 * @apiName GetRecentArticles
 * @apiGroup Articles
 * 
 * @apiQuery {Number} [limit=5] Maximum number of articles to return
 * 
 * @apiSuccess {Array} articles Array of recent articles
 */
const getRecentArticles = async (ctx: KoaContext<ArticleWithAuthor[]>) => {
  const limit = ctx.query.limit ? parseInt(ctx.query.limit as string) : 5
  const articles = await getRecentArticlesService(limit)
  ctx.body = articles
}
getRecentArticles.validationScheme = {
  query: {
    limit: Joi.number().integer().min(1).max(20).optional(),
  }
}

/**
 * @api {get} /articles/:id Get article by ID
 * @apiName GetArticleById
 * @apiGroup Articles
 * 
 * @apiParam {Number} id Article ID
 * 
 * @apiSuccess {Object} article Article object
 * @apiError (404) NotFound Article not found
 */
const getArticleById = async (ctx: KoaContext<ArticleWithAuthor>) => {
  const articleId = parseInt((ctx.params as { id: string }).id)
  const article = await getArticleByIdService(articleId)
  
  if (!article) {
    ctx.status = 404
    return
  }
  
  ctx.body = article
}
getArticleById.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  }
}

/**
 * @api {post} /articles Create new article
 * @apiName CreateArticle
 * @apiGroup Articles
 * @apiPermission admin,bestuurslid
 * 
 * @apiParam {String} title Article title
 * @apiParam {String} content Article content
 * @apiParam {String} [excerpt] Article excerpt
 * @apiParam {String} [type=NEWS] Article type (NEWS, TOURNAMENT_REPORT, GENERAL)
 * @apiParam {Boolean} [published=false] Whether article is published
 * @apiParam {Boolean} [featured=false] Whether article is featured
 * 
 * @apiSuccess {Object} article Created article
 * @apiError (400) BadRequest Invalid input data
 * @apiError (401) Unauthorized Authentication required
 * @apiError (403) Forbidden Insufficient permissions
 */
const createArticle = async (ctx: KoaContext<ArticleWithAuthor, CreateArticleRequest>) => {
  const userId = ctx.state.session.userId
  const articleData = ctx.request.body as CreateArticleRequest
  
  const article = await createArticleService(userId, articleData)
  ctx.status = 201
  ctx.body = article
}
createArticle.validationScheme = {
  body: {
    title: Joi.string().required(),
    content: Joi.string().required(),
    excerpt: Joi.string().allow('').optional(),
    type: Joi.string().valid('NEWS', 'TOURNAMENT_REPORT', 'GENERAL').optional(),
    published: Joi.boolean().default(false),
    featured: Joi.boolean().default(false),
  }
}

/**
 * @api {put} /articles/:id Update article
 * @apiName UpdateArticle
 * @apiGroup Articles
 * @apiPermission admin,bestuurslid (own articles only)
 * 
 * @apiParam {Number} id Article ID
 * @apiParam {String} [title] Article title
 * @apiParam {String} [content] Article content
 * @apiParam {String} [excerpt] Article excerpt
 * @apiParam {String} [type] Article type (NEWS, TOURNAMENT_REPORT, GENERAL)
 * @apiParam {Boolean} [published] Whether article is published
 * @apiParam {Boolean} [featured] Whether article is featured
 * 
 * @apiSuccess {Object} article Updated article
 * @apiError (400) BadRequest Invalid input data
 * @apiError (401) Unauthorized Authentication required
 * @apiError (403) Forbidden Insufficient permissions
 * @apiError (404) NotFound Article not found
 */
const updateArticle = async (ctx: KoaContext<ArticleWithAuthor, UpdateArticleRequest>) => {
  const articleId = parseInt((ctx.params as { id: string }).id)
  const userId = ctx.state.session.userId
  const userRoles = ctx.state.session.roles || []
  const articleData = ctx.request.body as UpdateArticleRequest
  
  const article = await updateArticleService(articleId, userId, userRoles, articleData)
  ctx.body = article
}
updateArticle.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
  body: {
    title: Joi.string().optional(),
    content: Joi.string().optional(),
    excerpt: Joi.string().allow('').optional(),
    type: Joi.string().valid('NEWS', 'TOURNAMENT_REPORT', 'GENERAL').optional(),
    published: Joi.boolean().optional(),
    featured: Joi.boolean().optional(),
  }
}

/**
 * @api {delete} /articles/:id Delete article
 * @apiName DeleteArticle
 * @apiGroup Articles
 * @apiPermission admin,bestuurslid (own articles only)
 * 
 * @apiParam {Number} id Article ID
 * 
 * @apiSuccess (204) NoContent Article deleted successfully
 * @apiError (401) Unauthorized Authentication required
 * @apiError (403) Forbidden Insufficient permissions
 * @apiError (404) NotFound Article not found
 */
const deleteArticle = async (ctx: KoaContext) => {
  const articleId = parseInt((ctx.params as { id: string }).id)
  const userId = ctx.state.session.userId
  const userRoles = ctx.state.session.roles || []
  
  await deleteArticleService(articleId, userId, userRoles)
  ctx.status = 204
}
deleteArticle.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  }
}

export default (parent: Router<ChessAppState, ChessAppContext>) => {
  const router = new Router({
    prefix: '/articles',
  })

  // Public routes
  router.get('/', validate(getArticles.validationScheme), getArticles)
  router.get('/recent', validate(getRecentArticles.validationScheme), getRecentArticles)
  router.get('/:id', validate(getArticleById.validationScheme), getArticleById)

  // Protected routes (admin and bestuurslid only)
  router.post('/', requireAuthentication, makeRequireRole(['admin', 'bestuurslid']), validate(createArticle.validationScheme), createArticle)
  router.put('/:id', requireAuthentication, makeRequireRole(['admin', 'bestuurslid']), validate(updateArticle.validationScheme), updateArticle)
  router.delete('/:id', requireAuthentication, makeRequireRole(['admin', 'bestuurslid']), validate(deleteArticle.validationScheme), deleteArticle)

  parent.use(router.routes()).use(router.allowedMethods())
}
