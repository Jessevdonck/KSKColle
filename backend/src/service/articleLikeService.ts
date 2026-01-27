import { prisma } from './data'
import handleDBError from './handleDBError'
import ServiceError from '../core/serviceError'
import { createArticleLikeNotification } from './notificationService'

export interface ArticleLikeEntry {
  user_id: number
  voornaam: string
  achternaam: string
}

export interface ArticleLikesResponse {
  likes: ArticleLikeEntry[]
  count: number
  user_has_liked?: boolean
}

export const likeArticle = async (userId: number, articleId: number): Promise<ArticleLikesResponse> => {
  try {
    const article = await prisma.article.findUnique({
      where: { article_id: articleId },
      select: { article_id: true, author_id: true, title: true },
    })
    if (!article) throw ServiceError.notFound('Article not found')

    const existing = await prisma.articleLike.findUnique({
      where: {
        article_id_user_id: { article_id: articleId, user_id: userId },
      },
    })
    if (existing) return getArticleLikes(articleId, userId)

    await prisma.articleLike.create({
      data: { article_id: articleId, user_id: userId },
    })

    const allLikes = await prisma.articleLike.findMany({
      where: { article_id: articleId },
      include: {
        user: { select: { user_id: true, voornaam: true, achternaam: true } },
      },
      orderBy: { created_at: 'asc' },
    })
    const otherCount = allLikes.filter((l) => l.user_id !== userId).length
    const liker = allLikes.find((l) => l.user_id === userId)?.user
    const likerName = liker ? `${liker.voornaam} ${liker.achternaam}` : 'Iemand'

    if (article.author_id !== userId) {
      await createArticleLikeNotification(
        article.author_id,
        likerName,
        articleId,
        article.title,
        otherCount
      )
    }

    return getArticleLikes(articleId, userId)
  } catch (error) {
    throw handleDBError(error)
  }
}

export const unlikeArticle = async (userId: number, articleId: number): Promise<ArticleLikesResponse> => {
  try {
    await prisma.articleLike.deleteMany({
      where: { article_id: articleId, user_id: userId },
    })
    return getArticleLikes(articleId, userId)
  } catch (error) {
    throw handleDBError(error)
  }
}

export const getArticleLikes = async (
  articleId: number,
  currentUserId?: number
): Promise<ArticleLikesResponse> => {
  try {
    const rows = await prisma.articleLike.findMany({
      where: { article_id: articleId },
      include: {
        user: { select: { user_id: true, voornaam: true, achternaam: true } },
      },
      orderBy: { created_at: 'asc' },
    })
    const likes: ArticleLikeEntry[] = rows.map((r) => ({
      user_id: r.user.user_id,
      voornaam: r.user.voornaam,
      achternaam: r.user.achternaam,
    }))
    return currentUserId != null
      ? { likes, count: likes.length, user_has_liked: likes.some((l) => l.user_id === currentUserId) }
      : { likes, count: likes.length }
  } catch (error) {
    throw handleDBError(error)
  }
}
