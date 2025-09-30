"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "../contexts/auth"
import { getAllArticles } from "../api/index"
import { Article, ArticleListResponse } from "../../data/article"
import { Plus, Search, Calendar, User, Tag, Eye, EyeOff, Star } from "lucide-react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

export default function ArticlesPage() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
   const [filters, setFilters] = useState({
     search: "",
     published: "all",
   })

  useEffect(() => {
    fetchArticles()
  }, [currentPage, filters])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: currentPage,
        pageSize: 10,
      }

      // Check if user is admin or bestuurslid
      const canManage = user && (user.roles?.includes("admin") || user.roles?.includes("bestuurslid"))
      
      if (canManage) {
        // Admins and bestuursleden can see all articles and use filters
        if (filters.published && filters.published !== "all") {
          params.published = filters.published === "true"
        }
      } else {
        // Normal users can only see published articles
        params.published = true
      }

      const response: ArticleListResponse = await getAllArticles(params)
      
      let filteredArticles = response.items
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredArticles = filteredArticles.filter(article =>
          article.title.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.excerpt?.toLowerCase().includes(searchLower)
        )
      }

      setArticles(filteredArticles)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error("Error fetching articles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1)
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

  const canCreate = user && (user.roles?.includes("admin") || user.roles?.includes("bestuurslid"))
  const canManage = user && (user.roles?.includes("admin") || user.roles?.includes("bestuurslid"))

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Artikels</h1>
            <p className="text-gray-600">Beheer alle artikels op de website</p>
          </div>
          
          {canCreate && (
            <Link href="/articles/create">
              <Button className="bg-mainAccent hover:bg-mainAccentDark text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nieuw artikel
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Zoek in artikels..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Only show published filter for admins and bestuursleden */}
              {canManage && (
                <Select
                  value={filters.published}
                  onValueChange={(value) => handleFilterChange("published", value)}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Alle statussen</SelectItem>
                     <SelectItem value="true">Gepubliceerd</SelectItem>
                     <SelectItem value="false">Concept</SelectItem>
                   </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Articles list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Geen artikels gevonden</h3>
                <p className="text-gray-600 mb-4">
                  Er zijn geen artikels die voldoen aan je zoekcriteria.
                </p>
                {canCreate && (
                  <Link href="/articles/create">
                    <Button className="bg-mainAccent hover:bg-mainAccentDark text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Eerste artikel aanmaken
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.article_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          <Tag className="h-3 w-3 mr-1" />
                          {getArticleTypeLabel(article.type)}
                        </Badge>
                        {article.published ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Eye className="h-3 w-3 mr-1" />
                            Gepubliceerd
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 border-gray-600">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Concept
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">
                        <Link 
                          href={`/articles/${article.article_id}`}
                          className="hover:text-mainAccent transition-colors"
                        >
                          {article.title}
                        </Link>
                      </CardTitle>
                      {article.excerpt && (
                        <CardDescription className="mt-2">
                          {article.excerpt}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
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
                            ? format(new Date(article.published_at), "dd MMM yyyy", { locale: nl })
                            : format(new Date(article.created_at), "dd MMM yyyy", { locale: nl })
                          }
                        </span>
                      </div>
                    </div>
                    
                    <Link href={`/articles/${article.article_id}`}>
                      <Button variant="outline" size="sm">
                        Lees meer
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Vorige
              </Button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Volgende
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
