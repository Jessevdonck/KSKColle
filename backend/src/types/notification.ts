export interface Notification {
  notification_id: number
  user_id: number
  type: string
  title: string
  message: string
  related_article_id?: number | null
  related_comment_id?: number | null
  is_read: boolean
  created_at: Date | string
}

export interface CreateNotificationRequest {
  user_id: number
  type: string
  title: string
  message: string
  related_article_id?: number
  related_comment_id?: number
}

export interface GetNotificationsRequest {
  user_id: number
  limit?: number
  offset?: number
  unread_only?: boolean
}

export interface GetNotificationsResponse {
  notifications: Notification[]
  total: number
  unread_count: number
  hasMore: boolean
}

export const NotificationTypes = {
  ARTICLE_COMMENT: 'article_comment',
  COMMENT_REPLY: 'comment_reply',
  GAME_POSTPONED: 'game_postponed',
  ABSENCE_REPORTED: 'absence_reported',
} as const
