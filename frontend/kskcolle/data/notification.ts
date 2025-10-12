export interface Notification {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_article_id?: number | null;
  related_comment_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  hasMore: boolean;
}
