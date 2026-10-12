import sharp from 'sharp'
import { Prisma } from '@prisma/client'
import { prisma } from '../data/index'

// Artikelfoto's staan als base64 in de database (soms meerdere MB per artikel).
// Overzichtspagina's halen daarom geen foto's meer mee in de lijst, maar laden
// per artikel een kleine thumbnail via deze service.

const THUMBNAIL_WIDTH = 800
const CACHE_LIMIT = 200

type Thumbnail = { body: Buffer; contentType: string } | { redirect: string }

// Eenvoudige LRU-cache: Map behoudt de invoegvolgorde.
const cache = new Map<string, Thumbnail>()

const remember = (key: string, value: Thumbnail) => {
  cache.delete(key)
  cache.set(key, value)
  if (cache.size > CACHE_LIMIT) {
    cache.delete(cache.keys().next().value as string)
  }
  return value
}

/** Relatieve URL van de thumbnail; `v` wijzigt bij elke update zodat de browser lang mag cachen. */
export const thumbnailPath = (articleId: number, updatedAt: Date) =>
  `/articles/${articleId}/thumbnail?v=${updatedAt.getTime()}`

/** Welke van de gegeven artikels hebben minstens één foto (zonder de foto's zelf op te halen). */
export const getArticleIdsWithImages = async (articleIds: number[]): Promise<Set<number>> => {
  if (articleIds.length === 0) return new Set()
  const rows = await prisma.$queryRaw<{ article_id: number }[]>`
    SELECT article_id FROM Article
    WHERE article_id IN (${Prisma.join(articleIds)})
      AND image_urls IS NOT NULL
      AND JSON_LENGTH(image_urls) > 0
  `
  return new Set(rows.map((row) => Number(row.article_id)))
}

export const getArticleThumbnail = async (articleId: number): Promise<Thumbnail | null> => {
  // Eerst enkel updated_at ophalen: bij een cache-hit hoeven de (zware) foto's niet uit de database
  const article = await prisma.article.findUnique({
    where: { article_id: articleId },
    select: { updated_at: true },
  })
  if (!article) return null

  const key = `${articleId}:${article.updated_at.getTime()}`
  const cached = cache.get(key)
  if (cached) return remember(key, cached)

  // Alleen de eerste foto ophalen, niet de hele lijst
  const [row] = await prisma.$queryRaw<{ image: string | null }[]>`
    SELECT JSON_UNQUOTE(JSON_EXTRACT(image_urls, '$[0]')) AS image
    FROM Article WHERE article_id = ${articleId}
  `
  const firstImage = row?.image
  if (!firstImage) return null

  // Externe afbeelding: daar gewoon naar doorverwijzen
  if (!firstImage.startsWith('data:')) {
    return remember(key, { redirect: firstImage })
  }

  const base64 = firstImage.slice(firstImage.indexOf(',') + 1)
  const body = await sharp(Buffer.from(base64, 'base64'))
    .rotate() // EXIF-oriëntatie van gsm-foto's respecteren
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer()

  return remember(key, { body, contentType: 'image/webp' })
}
