"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../../contexts/auth"
import { createArticle } from "../../api/index"
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import RichTextEditor from "../../components/RichTextEditor"
import { canManageArticles } from "@/lib/roleUtils"

export default function CreateArticlePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    type: "NEWS",
    published: false,
    featured: true, // Always true, no option to change
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createArticle(formData)
      router.push("/articles")
    } catch (error) {
      console.error("Error creating article:", error)
      console.error("Error response:", error.response?.data)
      console.error("Error details:", error.response?.data?.details)
      alert(`Er is een fout opgetreden bij het aanmaken van het artikel: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Check if user has permission to create articles
  if (!canManageArticles(user)) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Geen toegang</h2>
                <p className="text-gray-600 mb-4">
                  Je hebt geen toestemming om artikels aan te maken.
                </p>
                <Link href="/">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Terug naar home
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
          <Link href="/articles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar artikels
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Nieuw artikel aanmaken</h1>
            <p className="text-gray-600">Schrijf een nieuw artikel voor de website</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Artikel inhoud</CardTitle>
                  <CardDescription>
                    Vul de titel en inhoud van het artikel in
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
                      type="submit"
                      className="w-full bg-mainAccent hover:bg-mainAccentDark text-white"
                      disabled={loading}
                    >
                      {loading ? (
                        "Bezig met opslaan..."
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Artikel opslaan
                        </>
                      )}
                    </Button>
                    
                    {formData.published && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Eye className="h-4 w-4" />
                        <span>Dit artikel wordt direct gepubliceerd</span>
                      </div>
                    )}
                    
                    {!formData.published && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <EyeOff className="h-4 w-4" />
                        <span>Dit artikel wordt opgeslagen als concept</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}