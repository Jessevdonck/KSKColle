"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getRecentArticles } from "../api/index"
import { Article } from "../data/article"
import { Calendar, User, Tag, Star, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

export default function RecentArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentArticles()
  }, [])

  const fetchRecentArticles = async () => {
    try {
      const data = await getRecentArticles(3) // Get 3 most recent articles
      setArticles(data)
    } catch (error) {
      console.error("Error fetching recent articles:", error)
    } finally {
      setLoading(false)
    }
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

  const getArticleTypeColor = (type: string) => {
    switch (type) {
      case "NEWS":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "TOURNAMENT_REPORT":
        return "bg-green-100 text-green-800 border-green-200"
      case "GENERAL":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }


  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Laatste nieuws</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/4 mt-4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (articles.length === 0) {
    return null // Don't show section if no articles
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Laatste nieuws</h2>
          <Link href="/articles">
            <Button variant="outline" className="border-mainAccent text-mainAccent hover:bg-mainAccent hover:text-white">
              Alle artikels
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article, index) => (
            <Card key={article.article_id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getArticleTypeColor(article.type)}`}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {getArticleTypeLabel(article.type)}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">
                  <Link 
                    href={`/articles/${article.article_id}`}
                    className="hover:text-mainAccent transition-colors"
                  >
                    {article.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{article.author.voornaam} {article.author.achternaam}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {article.published_at
                          ? format(new Date(article.published_at), "dd MMM", { locale: nl })
                          : format(new Date(article.created_at), "dd MMM", { locale: nl })
                        }
                      </span>
                    </div>
                  </div>
                  
                  <Link href={`/articles/${article.article_id}`}>
                    <Button variant="ghost" size="sm" className="text-mainAccent hover:text-mainAccentDark hover:bg-mainAccent hover:bg-opacity-10">
                      Lees meer
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
