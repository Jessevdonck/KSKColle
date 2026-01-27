import { PrismaClient } from '@prisma/client'
import handleDBError from './handleDBError'
import type { 
  Notification, 
  CreateNotificationRequest, 
  GetNotificationsRequest, 
  GetNotificationsResponse 
} from '../types/notification'
import { NotificationTypes } from '../types/notification'

const prisma = new PrismaClient()

export const createNotification = async (notificationData: CreateNotificationRequest): Promise<Notification> => {
  try {
    const notification = await prisma.notification.create({
      data: {
        user_id: notificationData.user_id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        related_article_id: notificationData.related_article_id || null,
        related_comment_id: notificationData.related_comment_id || null,
      }
    })

    return notification
  } catch (error) {
    throw handleDBError(error)
  }
}

export const getNotificationsByUserId = async (request: GetNotificationsRequest): Promise<GetNotificationsResponse> => {
  try {
    const { user_id, limit = 20, offset = 0, unread_only = false } = request

    const whereClause: any = { user_id }
    if (unread_only) {
      whereClause.is_read = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: whereClause,
      }),
      prisma.notification.count({
        where: { user_id, is_read: false },
      })
    ])

    return {
      notifications,
      total,
      unread_count: unreadCount,
      hasMore: offset + notifications.length < total,
    }
  } catch (error) {
    throw handleDBError(error)
  }
}

export const markNotificationAsRead = async (notificationId: number, userId: number): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: {
        notification_id: notificationId,
        user_id: userId,
      },
      data: {
        is_read: true,
      }
    })
  } catch (error) {
    throw handleDBError(error)
  }
}

export const markAllNotificationsAsRead = async (userId: number): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
      }
    })
  } catch (error) {
    throw handleDBError(error)
  }
}

export const deleteNotification = async (notificationId: number, userId: number): Promise<void> => {
  try {
    await prisma.notification.deleteMany({
      where: {
        notification_id: notificationId,
        user_id: userId,
      }
    })
  } catch (error) {
    throw handleDBError(error)
  }
}

// Helper function to create article comment notification
export const createArticleCommentNotification = async (
  articleAuthorId: number, 
  commentAuthorId: number, 
  commentAuthorName: string,
  articleId: number, 
  articleTitle: string
): Promise<void> => {
  // Don't notify the comment author about their own comment
  if (articleAuthorId === commentAuthorId) return

  try {
    await createNotification({
      user_id: articleAuthorId,
      type: NotificationTypes.ARTICLE_COMMENT,
      title: 'Nieuwe reactie op je artikel',
      message: `${commentAuthorName} heeft gereageerd op je artikel "${articleTitle}"`,
      related_article_id: articleId,
    })
  } catch (error) {
    // Don't throw error for notification failures - comments should still work
    console.error('Failed to create article comment notification:', error)
  }
}

// Helper function to create comment reply notification
export const createCommentReplyNotification = async (
  commentAuthorId: number, 
  replyAuthorId: number, 
  replyAuthorName: string,
  articleId: number,
  commentId: number,
  articleTitle: string
): Promise<void> => {
  // Don't notify the reply author about their own reply
  if (commentAuthorId === replyAuthorId) return

  try {
    await createNotification({
      user_id: commentAuthorId,
      type: NotificationTypes.COMMENT_REPLY,
      title: 'Reactie op je commentaar',
      message: `${replyAuthorName} heeft gereageerd op je commentaar bij "${articleTitle}"`,
      related_article_id: articleId,
      related_comment_id: commentId,
    })
  } catch (error) {
    // Don't throw error for notification failures - comments should still work
    console.error('Failed to create comment reply notification:', error)
  }
}

export const createArticleLikeNotification = async (
  articleAuthorId: number,
  likerName: string,
  articleId: number,
  articleTitle: string,
  otherLikeCount: number
): Promise<void> => {
  try {
    const message = otherLikeCount === 0
      ? `${likerName} heeft je post "${articleTitle}" geliket`
      : otherLikeCount === 1
        ? `${likerName} en 1 ander hebben je post "${articleTitle}" geliket`
        : `${likerName} en ${otherLikeCount} anderen hebben je post "${articleTitle}" geliket`
    await createNotification({
      user_id: articleAuthorId,
      type: NotificationTypes.ARTICLE_LIKE,
      title: 'Vind ik leuk',
      message,
      related_article_id: articleId,
    })
  } catch (error) {
    console.error('Failed to create article like notification:', error)
  }
}
