"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "../../contexts/auth"
import { getArticleById, deleteArticle } from "../../api/index"
import { Article } from "../../../data/article"
import { ArrowLeft, Edit, Trash2, Calendar, User, Tag, Share2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { isAdmin, isBoardMember } from "@/lib/roleUtils"
import CommentsSection from "../../../components/CommentsSection"

export default function ArticleDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [contentWithoutImages, setContentWithoutImages] = useState("")
  const [extractedImages, setExtractedImages] = useState<string[]>([])

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await getArticleById(parseInt(params.id as string))
        setArticle(data)
        
        // Extract images from content
        const parser = new DOMParser()
        const doc = parser.parseFromString(data.content, 'text/html')
        const images = Array.from(doc.querySelectorAll('img'))
        const imageSrcs = images.map(img => img.src)
        
        // Remove images from content
        images.forEach(img => img.remove())
        const contentWithoutImgs = doc.body.innerHTML
        
        // Combine images from content and from image_urls field
        const allImages = [...imageSrcs]
        if (data.image_urls && data.image_urls.length > 0) {
          data.image_urls.forEach(url => {
            if (!allImages.includes(url)) {
              allImages.push(url)
            }
          })
        }
        
        setExtractedImages(allImages)
        setContentWithoutImages(contentWithoutImgs)
      } catch (error) {
        console.error("Error fetching article:", error)
        router.push("/articles")
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [params.id, router])

  const handleDelete = async () => {
    if (!article || !confirm("Weet je zeker dat je dit artikel wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.")) {
      return
    }

    setDeleting(true)
    try {
      await deleteArticle(article.article_id)
      router.push("/articles")
    } catch (error) {
      console.error("Error deleting article:", error)
      alert("Er is een fout opgetreden bij het verwijderen van het artikel.")
    } finally {
      setDeleting(false)
    }
  }

  const handleShareToFacebookGroup = async () => {
    if (!article) return

    // Strip HTML tags from content but keep all text
    const strippedContent = article.content.replace(/<[^>]*>/g, ' ')
    const cleanedContent = strippedContent.replace(/\s+/g, ' ').trim()

    const shareText = cleanedContent

    try {
      // Copy to clipboard silently
      await navigator.clipboard.writeText(shareText)
    } catch (error) {
      console.error('Clipboard error:', error)
    }
    
    // Open Facebook group in new tab
    window.open('https://www.facebook.com/groups/KSKColleSintNiklaas', '_blank')
  }

  const getArticleTypeLabel = (type: string) => {
    switch (type) {
      case "NEWS":
        return "Nieuws"
      case "TOURNAMENT_REPORT":
        return "Toernooiverslag"
      case "GENERAL":
        return "Algemeen"
      default:
        return type
    }
  }

  // Admin and bestuurslid can edit all articles, authors can only edit their own
  const canEdit = user && article && (
    isAdmin(user) || 
    isBoardMember(user) ||
    article.author_id === user.user_id
  )

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!article) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Artikel niet gevonden</h2>
                <p className="text-gray-600 mb-4">
                  Het gevraagde artikel kon niet worden gevonden.
                </p>
                <Link href="/articles">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Terug naar artikels
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <style jsx global>{`
        .article-content h1 {
          font-size: 2rem !important;
          font-weight: bold !important;
          color: #111827 !important;
          margin: 1.5rem 0 1rem 0 !important;
          line-height: 1.2 !important;
        }
        .article-content h2 {
          font-size: 1.5rem !important;
          font-weight: bold !important;
          color: #111827 !important;
          margin: 1.25rem 0 0.875rem 0 !important;
          line-height: 1.3 !important;
        }
        .article-content h3 {
          font-size: 1.25rem !important;
          font-weight: bold !important;
          color: #111827 !important;
          margin: 1rem 0 0.75rem 0 !important;
          line-height: 1.4 !important;
        }
        .article-content ul {
          list-style-type: disc !important;
          margin: 0.75rem 0 !important;
          padding-left: 1.5rem !important;
        }
        .article-content ol {
          list-style-type: decimal !important;
          margin: 0.75rem 0 !important;
          padding-left: 1.5rem !important;
        }
        .article-content li {
          margin: 0.375rem 0 !important;
          display: list-item !important;
        }
        .article-content ul li {
          list-style-type: disc !important;
        }
        .article-content ol li {
          list-style-type: decimal !important;
        }
        .article-content blockquote {
          border-left: 4px solid #d1d5db !important;
          background-color: #f9fafb !important;
          padding: 1rem 1.5rem !important;
          margin: 1.5rem 0 !important;
          border-radius: 0 0.375rem 0.375rem 0 !important;
          font-style: italic !important;
        }
        .article-content strong {
          font-weight: bold !important;
        }
        .article-content em {
          font-style: italic !important;
        }
        .article-content img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          margin: 1.5rem 0 !important;
        }
        .article-content p {
          margin: 1rem 0 !important;
          line-height: 1.6 !important;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/articles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar artikels
            </Button>
          </Link>
          
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareToFacebookGroup}
                className="bg-[#1877f2] text-white hover:bg-[#1664d8] border-[#1877f2] hover:border-[#1664d8]"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Delen
              </Button>
              <Link href={`/articles/${article.article_id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Bewerken
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Verwijderen..." : "Verwijderen"}
              </Button>
            </div>
          )}
        </div>

        <article className="space-y-6">
          <header className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Tag className="h-3 w-3 mr-1" />
                {getArticleTypeLabel(article.type)}
              </Badge>
              {!article.published && (
                <Badge variant="outline">Concept</Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>
                  {article.author.voornaam} {article.author.achternaam}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {article.published_at
                    ? format(new Date(article.published_at), "dd MMMM yyyy", { locale: nl })
                    : format(new Date(article.created_at), "dd MMMM yyyy", { locale: nl })
                  }
                </span>
              </div>
            </div>
          </header>

          <Card>
            <CardContent className="p-6">
              <div 
                className="article-content"
                dangerouslySetInnerHTML={{ 
                  __html: contentWithoutImages 
                }}
              />
            </CardContent>
          </Card>

          {/* Extracted Images from content - Always at the bottom */}
          {extractedImages.length > 0 && (
            <div className="mt-8 space-y-4">
              {extractedImages.map((imgSrc, index) => (
                <div key={index} className="flex justify-center">
                  <img 
                    src={imgSrc} 
                    alt={`${article.title} - afbeelding ${index + 1}`}
                    className="max-w-full max-h-[600px] h-auto rounded-lg shadow-lg object-contain"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-8">
            <CommentsSection articleId={article.article_id} />
          </div>
        </article>
      </div>
    </main>
  )
}
