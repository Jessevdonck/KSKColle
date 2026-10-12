"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "../contexts/auth"
import { getAllArticles } from "../api/index"
import { Article, ArticleListResponse, articleThumbnailUrl } from "../../data/article"
import { Plus, Search, Calendar, User, EyeOff, ArrowRight, ChevronLeft, ChevronRight, Newspaper } from "lucide-react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { canManageArticles } from "@/lib/roleUtils"

const PAGE_SIZE = 10

const getTextPreview = (content: string, maxLength: number = 220) => {
  const cleaned = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.substring(0, maxLength).trim() + "..."
}

const articleDate = (article: Article) =>
  format(new Date(article.published_at ?? article.created_at), "d MMM yyyy", { locale: nl })

export default function ArticlesPage() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    search: "",
    published: "all",
  })
  // Zoekterm die effectief naar de API gaat: pas na een korte pauze in het typen
  const [search, setSearch] = useState("")
  // Enkel het antwoord van de laatste aanvraag tonen (oudere kunnen later binnenkomen)
  const requestId = useRef(0)

  const canManage = canManageArticles(user)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const term = filters.search.trim()
      if (term !== search) {
        setSearch(term)
        setCurrentPage(1)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [filters.search, search])

  useEffect(() => {
    fetchArticles()
  }, [currentPage, filters.published, search, user])

  const fetchArticles = async () => {
    const id = ++requestId.current
    setLoading(true)
    try {
      const params: any = {
        page: currentPage,
        pageSize: PAGE_SIZE,
      }
      if (search) {
        params.search = search
      }

      if (canManage) {
        // Beheerders zien alle artikels en kunnen filteren op status
        if (filters.published !== "all") {
          params.published = filters.published === "true"
        }
      } else {
        params.published = true
      }

      const response: ArticleListResponse = await getAllArticles(params)
      if (id !== requestId.current) return

      setArticles(response.items)
      setTotal(response.total)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error("Error fetching articles:", error)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    // De zoekterm springt pas naar pagina 1 als ze effectief verstuurd wordt
    if (field !== "search") setCurrentPage(1)
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Het nieuwste artikel krijgt een grote kaart bovenaan (enkel op de eerste pagina, zonder zoekterm)
  const showFeatured = currentPage === 1 && !search && articles.length > 0
  const featured = showFeatured ? articles[0] : null
  const gridArticles = showFeatured ? articles.slice(1) : articles

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-5">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-textColor flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-mainAccent" />
                Artikels
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">Nieuws, verslagen en standen van KSK Colle</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 md:w-auto w-full">
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Zoek in artikels..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>

              {canManage && (
                <Select
                  value={filters.published}
                  onValueChange={(value) => handleFilterChange("published", value)}
                >
                  <SelectTrigger className="w-full sm:w-40 bg-white">
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="true">Gepubliceerd</SelectItem>
                    <SelectItem value="false">Concept</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {canManage && (
                <Link href="/articles/create">
                  <Button variant="accent" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Nieuw artikel
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {search && !loading && articles.length > 0 && (
            <p className="mb-3 text-sm text-gray-600">
              {total} {total === 1 ? "resultaat" : "resultaten"} voor{" "}
              <span className="font-semibold text-textColor">&ldquo;{search}&rdquo;</span>
            </p>
          )}

          {loading ? (
            <ArticlesSkeleton />
          ) : articles.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 text-center">
              <Newspaper className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-1">Geen artikels gevonden</h3>
              <p className="text-sm text-gray-600 mb-4">
                {search ? (
                  <>Er zijn geen artikels met &ldquo;{search}&rdquo;.</>
                ) : (
                  "Er zijn geen artikels die voldoen aan je zoekcriteria."
                )}
              </p>
              {canManage && (
                <Link href="/articles/create">
                  <Button variant="accent">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Nieuw artikel
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {featured && <FeaturedArticleCard article={featured} showStatus={canManage} />}

              {gridArticles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gridArticles.map((article) => (
                    <ArticleCard key={article.article_id} article={article} showStatus={canManage} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Paginering */}
          {totalPages > 1 && !loading && (
            <nav className="flex items-center justify-center gap-1 mt-6" aria-label="Paginering">
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label="Vorige pagina"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => goToPage(i + 1)}
                  aria-current={currentPage === i + 1 ? "page" : undefined}
                  className={`h-9 min-w-9 px-3 rounded-md text-sm font-medium transition-colors ${
                    currentPage === i + 1
                      ? "bg-mainAccent text-white"
                      : "bg-white border border-neutral-200 text-gray-700 hover:border-mainAccent hover:text-mainAccent"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label="Volgende pagina"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          )}
        </div>
      </div>
    </main>
  )
}

function ArticleThumbnail({ article, sizes, priority = false }: { article: Article; sizes: string; priority?: boolean }) {
  const imageUrl = articleThumbnailUrl(article)

  if (!imageUrl) {
    // Geen afbeelding: clublogo op een warme achtergrond
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-mainAccent/80 to-mainAccentDark flex items-center justify-center">
        <Image src="/images/logo.png" alt="" width={96} height={96} className="opacity-30 w-16 h-16 sm:w-20 sm:h-20 object-contain" />
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={article.title}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized
      className="object-cover transition-transform duration-500 group-hover:scale-105"
    />
  )
}

function DraftBadge() {
  return (
    <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-gray-900/80 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
      <EyeOff className="h-3 w-3" />
      Concept
    </span>
  )
}

function FeaturedArticleCard({ article, showStatus }: { article: Article; showStatus: boolean }) {
  return (
    <Link
      href={`/articles/${article.article_id}`}
      className="group mb-4 grid overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-lg md:grid-cols-5"
    >
      <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[300px] md:col-span-3 overflow-hidden bg-neutral-100">
        {showStatus && !article.published && <DraftBadge />}
        <ArticleThumbnail article={article} sizes="(max-width: 768px) 100vw, 60vw" priority />
      </div>
      <div className="flex flex-col p-4 md:p-6 md:col-span-2">
        <span className="mb-2 inline-flex w-fit items-center rounded-full bg-mainAccent/10 px-2.5 py-0.5 text-xs font-semibold text-mainAccent">
          Nieuwste artikel
        </span>
        <h2 className="text-xl md:text-2xl font-bold leading-tight text-textColor group-hover:text-mainAccent transition-colors line-clamp-3">
          {article.title}
        </h2>
        <p className="mt-2 text-sm text-gray-600 line-clamp-4 md:line-clamp-6">
          {article.excerpt || getTextPreview(article.content, 400)}
        </p>
        <div className="mt-auto pt-4 flex items-center justify-between gap-2 text-xs text-gray-500">
          <ArticleMeta article={article} />
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-mainAccent">
            Lees meer
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function ArticleCard({ article, showStatus }: { article: Article; showStatus: boolean }) {
  return (
    <Link
      href={`/articles/${article.article_id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
        {showStatus && !article.published && <DraftBadge />}
        <ArticleThumbnail article={article} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="font-bold leading-snug text-textColor group-hover:text-mainAccent transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="mt-1.5 text-sm text-gray-600 line-clamp-3">
          {article.excerpt || getTextPreview(article.content)}
        </p>
        <div className="mt-auto pt-3 text-xs text-gray-500">
          <ArticleMeta article={article} />
        </div>
      </div>
    </Link>
  )
}

function ArticleMeta({ article }: { article: Article }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <span className="inline-flex min-w-0 items-center gap-1">
        <User className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{article.author.voornaam} {article.author.achternaam}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        {articleDate(article)}
      </span>
    </div>
  )
}

function ArticlesSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 grid overflow-hidden rounded-xl border border-neutral-200 bg-white md:grid-cols-5">
        <div className="aspect-[16/9] md:aspect-auto md:min-h-[300px] md:col-span-3 bg-neutral-200" />
        <div className="space-y-3 p-6 md:col-span-2">
          <div className="h-4 w-24 rounded bg-neutral-200" />
          <div className="h-6 w-4/5 rounded bg-neutral-200" />
          <div className="h-3 w-full rounded bg-neutral-200" />
          <div className="h-3 w-2/3 rounded bg-neutral-200" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="aspect-[16/9] bg-neutral-200" />
            <div className="space-y-2 p-3.5">
              <div className="h-4 w-3/4 rounded bg-neutral-200" />
              <div className="h-3 w-full rounded bg-neutral-200" />
              <div className="h-3 w-1/2 rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
