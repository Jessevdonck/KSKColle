"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../../../contexts/auth"
import { getArticleById, updateArticle } from "../../../api/index"
import { Article } from "../../../../data/article"
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import RichTextEditor from "../../../components/RichTextEditor"

export default function EditArticlePage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [article, setArticle] = useState<Article | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    type: "NEWS",
    published: false,
    featured: true, // Always true, no option to change
  })

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await getArticleById(parseInt(params.id as string))
        setArticle(data)
        setFormData({
          title: data.title,
          content: data.content,
          excerpt: data.excerpt || "",
          type: data.type,
          published: data.published,
          featured: true, // Always true
        })
      } catch (error) {
        console.error("Error fetching article:", error)
        router.push("/articles")
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [params.id, router])

  const handleSubmit = async () => {
    setSaving(true)

    try {
      await updateArticle(article!.article_id, formData)
      router.push(`/articles/${article!.article_id}`)
    } catch (error) {
      console.error("Error updating article:", error)
      alert("Er is een fout opgetreden bij het bijwerken van het artikel.")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Check permissions
  const canEdit = user && (
    user.roles?.includes("admin") || 
    (user.roles?.includes("bestuurslid") && article?.author_id === user.user_id)
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

  if (!article || !canEdit) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Geen toegang</h2>
                <p className="text-gray-600 mb-4">
                  Je hebt geen toestemming om dit artikel te bewerken.
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/articles/${article.article_id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar artikel
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Artikel bewerken</h1>
            <p className="text-gray-600">Bewerk het artikel: {article.title}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Artikel inhoud</CardTitle>
                  <CardDescription>
                    Bewerk de titel en inhoud van het artikel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titel *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Geef je artikel een titel..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Inhoud *</Label>
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content) => handleInputChange("content", content)}
                      placeholder="Schrijf hier de volledige inhoud van je artikel..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Instellingen</CardTitle>
                  <CardDescription>
                    Configureer de instellingen voor dit artikel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Hidden type and featured fields */}
                  <input type="hidden" name="type" value={formData.type} />
                  <input type="hidden" name="featured" value={formData.featured.toString()} />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="published">Gepubliceerd</Label>
                      <p className="text-sm text-gray-600">
                        Maak het artikel zichtbaar voor bezoekers
                      </p>
                    </div>
                    <Checkbox
                      id="published"
                      checked={formData.published}
                      onCheckedChange={(checked) => handleInputChange("published", checked)}
                    />
                  </div>

                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      className="w-full bg-mainAccent hover:bg-mainAccentDark text-white"
                      disabled={saving}
                    >
                      {saving ? (
                        "Bezig met opslaan..."
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Wijzigingen opslaan
                        </>
                      )}
                    </Button>
                    
                    {formData.published && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Eye className="h-4 w-4" />
                        <span>Dit artikel is gepubliceerd</span>
                      </div>
                    )}
                    
                    {!formData.published && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <EyeOff className="h-4 w-4" />
                        <span>Dit artikel is een concept</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
