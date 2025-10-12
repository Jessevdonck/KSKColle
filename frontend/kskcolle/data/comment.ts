export interface Comment {
  comment_id: number;
  article_id: number;
  author_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CommentWithAuthor extends Comment {
  author: {
    user_id: number;
    voornaam: string;
    achternaam: string;
    avatar_url: string | null;
  };
}

export interface CreateCommentRequest {
  article_id: number;
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface GetCommentsResponse {
  comments: CommentWithAuthor[];
  total: number;
  hasMore: boolean;
}
