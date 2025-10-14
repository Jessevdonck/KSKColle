export enum ArticleType {
  NEWS = 'NEWS',
  TOURNAMENT_REPORT = 'TOURNAMENT_REPORT',
  GENERAL = 'GENERAL'
}

export interface Article {
  article_id: number
  title: string
  content: string
  excerpt?: string
  image_urls?: string[]
  type: ArticleType
  author_id: number
  author: {
    user_id: number
    voornaam: string
    achternaam: string
  }
  published: boolean
  featured: boolean
  created_at: string
  updated_at: string
  published_at?: string
}

export interface CreateArticleRequest {
  title: string
  content: string
  excerpt?: string
  image_urls?: string[]
  type: ArticleType
  published?: boolean
  featured?: boolean
}

export interface UpdateArticleRequest {
  title?: string
  content?: string
  excerpt?: string
  image_urls?: string[]
  type?: ArticleType
  published?: boolean
  featured?: boolean
}

export interface ArticleListResponse {
  items: Article[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
