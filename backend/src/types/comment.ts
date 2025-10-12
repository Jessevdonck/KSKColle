export interface Comment {
  comment_id: number
  article_id: number
  author_id: number
  parent_comment_id?: number | null
  content: string
  created_at: Date | string
  updated_at: Date | string
}

export interface CommentWithAuthor extends Comment {
  author: {
    user_id: number
    voornaam: string
    achternaam: string
    avatar_url: string | null
  }
  replies?: CommentWithAuthor[]
}

export interface CreateCommentRequest {
  article_id: number
  content: string
  parent_comment_id?: number
}

export interface UpdateCommentRequest {
  content: string
}

export interface GetCommentsRequest {
  article_id: number
  limit?: number
  offset?: number
}

export interface GetCommentsResponse {
  comments: CommentWithAuthor[]
  total: number
  hasMore: boolean
}
