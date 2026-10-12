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
  /** Enkel in overzichtslijsten: kleine thumbnail, relatief t.o.v. de API-URL. */
  thumbnail_url?: string | null
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

/** Thumbnail voor overzichten; valt terug op de eerste foto als de API (nog) geen thumbnail meegeeft. */
export const articleThumbnailUrl = (article: Pick<Article, 'thumbnail_url' | 'image_urls'>): string | null => {
  if (article.thumbnail_url) return `${process.env.NEXT_PUBLIC_API_URL}${article.thumbnail_url}`
  return article.image_urls?.[0] ?? null
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
