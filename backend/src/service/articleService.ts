import { ArticleType, Prisma } from '@prisma/client'
import { prisma } from '../data/index'
import handleDBError from './handleDBError'
import { getArticleIdsWithImages, thumbnailPath } from './articleThumbnailService'
import type { 
  ArticleWithAuthor, 
  CreateArticleRequest, 
  UpdateArticleRequest, 
  GetArticlesRequest, 
  GetArticlesResponse,
  ArticleListItem,
} from '../types/article'

// Lijsten bevatten geen foto's (base64, soms MB's per artikel) maar een thumbnail-URL.
const articleListSelect = {
  article_id: true,
  title: true,
  content: true,
  excerpt: true,
  type: true,
  author_id: true,
  published: true,
  featured: true,
  created_at: true,
  updated_at: true,
  published_at: true,
  author: {
    select: {
      user_id: true,
      voornaam: true,
      achternaam: true,
    }
  }
} satisfies Prisma.ArticleSelect

type ArticleListRow = Prisma.ArticleGetPayload<{ select: typeof articleListSelect }>

const withThumbnails = async (articles: ArticleListRow[]): Promise<ArticleListItem[]> => {
  const withImages = await getArticleIdsWithImages(articles.map((a) => a.article_id))
  return articles.map((article) => ({
    ...article,
    thumbnail_url: withImages.has(article.article_id)
      ? thumbnailPath(article.article_id, article.updated_at)
      : null,
  }))
}


export const createArticle = async (authorId: number, articleData: CreateArticleRequest): Promise<ArticleWithAuthor> => {
  try {
    const article = await prisma.article.create({
      data: {
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt ?? null,
        image_urls: articleData.image_urls ? articleData.image_urls as any : null,
        type: articleData.type || ArticleType.NEWS,
        author_id: authorId,
        published: articleData.published || false,
        featured: articleData.featured || false,
        published_at: articleData.published ? new Date() : null,
      },
      include: {
        author: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
          }
        }
      }
    })

    return {
      ...article,
      image_urls: article.image_urls as string[] | null
    } as ArticleWithAuthor
  } catch (error) {
    throw handleDBError(error)
  }
}

export const getArticleById = async (articleId: number): Promise<ArticleWithAuthor | null> => {
  try {
    const article = await prisma.article.findUnique({
      where: {
        article_id: articleId,
      },
      include: {
        author: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
          }
        }
      }
    })

    if (!article) return null

    return {
      ...article,
      image_urls: article.image_urls as string[] | null
    } as ArticleWithAuthor
  } catch (error) {
    throw handleDBError(error)
  }
}

export const getArticles = async (params: GetArticlesRequest = {}): Promise<GetArticlesResponse> => {
  try {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}
    
    // Special handling for authors who want to see published + own drafts
    if (params.showAllForAuthor !== undefined) {
      where.OR = [
        { published: true }, // All published articles
        { author_id: params.showAllForAuthor } // Or their own drafts
      ]
    } else {
      // Normal filtering
      if (params.published !== undefined) {
        where.published = params.published
      }
      
      if (params.author_id) {
        where.author_id = params.author_id
      }
    }
    
    if (params.featured !== undefined) {
      where.featured = params.featured
    }
    
    if (params.type) {
      where.type = params.type
    }

    // Zoeken gebeurt in de database, zodat totaal en paginering over de resultaten gaan.
    // De MySQL-collatie is hoofdletterongevoelig.
    // % en _ zijn jokertekens in LIKE: escapen zodat "%" niet alles vindt
    const search = params.search?.trim().replace(/[\\%_]/g, (char) => `\\${char}`)
    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search } },
            { excerpt: { contains: search } },
            { content: { contains: search } },
          ],
        },
      ]
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { featured: 'desc' },
          { published_at: 'desc' },
          { created_at: 'desc' }
        ],
        select: articleListSelect,
      }),
      prisma.article.count({ where })
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      items: await withThumbnails(articles),
      total,
      page,
      pageSize,
      totalPages
    }
  } catch (error) {
    throw handleDBError(error)
  }
}

export const getRecentArticles = async (limit: number = 5): Promise<ArticleListItem[]> => {
  try {
    const articles = await prisma.article.findMany({
      where: {
        published: true,
      },
      take: limit,
      orderBy: [
        { featured: 'desc' },
        { published_at: 'desc' }
      ],
      select: articleListSelect,
    })

    return withThumbnails(articles)
  } catch (error) {
    throw handleDBError(error)
  }
}

export const updateArticle = async (articleId: number, authorId: number, userRoles: string[], articleData: UpdateArticleRequest): Promise<ArticleWithAuthor> => {
  try {
    // Check if user is the author or admin
    const article = await prisma.article.findUnique({
      where: { article_id: articleId },
      include: {
        author: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
          }
        }
      }
    })

    if (!article) {
      throw new Error('Article not found')
    }

    // Check if user is the author or has admin role
    const isAuthor = article.author_id === authorId
    const isAdmin = userRoles.includes('admin')
    
    if (!isAuthor && !isAdmin) {
      throw new Error('Unauthorized to update this article')
    }

    const updateData: any = { ...articleData }
    
    // If publishing for the first time, set published_at
    if (articleData.published && !article.published) {
      updateData.published_at = new Date()
    }
    
    // If unpublishing, clear published_at
    if (articleData.published === false && article.published) {
      updateData.published_at = null
    }

    const updatedArticle = await prisma.article.update({
      where: {
        article_id: articleId,
      },
      data: updateData,
      include: {
        author: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
          }
        }
      }
    })

    return {
      ...updatedArticle,
      image_urls: updatedArticle.image_urls as string[] | null
    } as ArticleWithAuthor
  } catch (error) {
    throw handleDBError(error)
  }
}

export const deleteArticle = async (articleId: number, userId: number, userRoles: string[]): Promise<void> => {
  try {
    // Check if user is the author or admin
    const article = await prisma.article.findUnique({
      where: { article_id: articleId },
      include: {
        author: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
          }
        }
      }
    })

    if (!article) {
      throw new Error('Article not found')
    }

    // Check if user is the author or has admin role
    const isAuthor = article.author_id === userId
    const isAdmin = userRoles.includes('admin')
    
    if (!isAuthor && !isAdmin) {
      throw new Error('Unauthorized to delete this article')
    }

    await prisma.article.delete({
      where: {
        article_id: articleId,
      }
    })
  } catch (error) {
    throw handleDBError(error)
  }
}
