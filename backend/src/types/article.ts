import { ArticleType } from '@prisma/client'

export { ArticleType }

export interface Article {
  article_id: number
  title: string
  content: string
  excerpt: string | null
  type: ArticleType
  author_id: number
  published: boolean
  featured: boolean
  created_at: Date
  updated_at: Date
  published_at: Date | null
}

export interface ArticleWithAuthor extends Article {
  author: {
    user_id: number
    voornaam: string
    achternaam: string
  }
}

export interface CreateArticleRequest {
  title: string
  content: string
  excerpt?: string | null
  type: ArticleType
  published?: boolean
  featured?: boolean
}

export interface UpdateArticleRequest {
  title?: string
  content?: string
  excerpt?: string | null
  type?: ArticleType
  published?: boolean
  featured?: boolean
}

export interface GetArticlesRequest {
  page?: number
  pageSize?: number
  type?: ArticleType
  published?: boolean
  featured?: boolean
  author_id?: number
}

export interface GetArticlesResponse {
  items: ArticleWithAuthor[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
