"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, Calendar, User, ArrowRight, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { getRecentArticles } from "../api/index"
import { Article } from "../../data/article"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

const HeroHomepage = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    fetchRecentArticles()
    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  const updateScreenSize = () => {
    if (window.innerWidth < 768) {
      setScreenSize('mobile')
    } else if (window.innerWidth < 1024) {
      setScreenSize('tablet')
    } else {
      setScreenSize('desktop')
    }
  }

  const getArticlesPerView = () => {
    switch (screenSize) {
      case 'mobile': return 1
      case 'tablet': return 2
      case 'desktop': return 3
      default: return 3
    }
  }

  const fetchRecentArticles = async () => {
    try {
      const data = await getRecentArticles(12) // Fetch more articles for carousel
      setArticles(data)
    } catch (error) {
      console.error("Error fetching recent articles:", error)
    } finally {
      setLoading(false)
    }
  }

  const articlesPerView = getArticlesPerView()
  const displayedArticles = articles.slice(
    currentIndex,
    currentIndex + articlesPerView
  )

  const goToNext = () => {
    if (currentIndex + articlesPerView < articles.length) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setCurrentIndex(0) // Wrap to beginning
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    } else {
      setCurrentIndex(Math.max(0, articles.length - articlesPerView)) // Wrap to end
    }
  }

  const getTextPreview = (content: string, maxLength: number = 150) => {
    // Strip HTML tags
    const stripped = content.replace(/<[^>]*>/g, ' ')
    // Remove extra whitespace
    const cleaned = stripped.replace(/\s+/g, ' ').trim()
    // Truncate to maxLength
    if (cleaned.length <= maxLength) return cleaned
    return cleaned.substring(0, maxLength).trim() + '...'
  }

  return (
    <div className="text-white relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-center transform-gpu"
        style={{
          backgroundImage: "url('/images/Clubfoto.jpg')",
          transform: "translateZ(0)",
        }}
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-black/40"></div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-20 pb-16">
        {/* Welcome Section - Naar boven verplaatst */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-7xl tracking-tight leading-tight drop-shadow-2xl">
              Welkom bij{" "}
              <span
                className="block mt-4 text-mainAccent font-black"
                style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.8)" }}
              >
                KSK Colle
              </span>
            </h1>
            <p className="mt-8 text-xl sm:text-2xl text-white font-medium drop-shadow-lg">
              De gezelligste schaakclub van het Waasland!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={"#contact"}>
              <Button
                size="lg"
                className="bg-mainAccent text-white hover:bg-mainAccentDark font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform-gpu"
                data-cy="contact"
              >
                Contact
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link href={"/about"}>
              <Button
                variant="outline"
                size="lg"
                className="bg-black/50 border-2 border-white/60 hover:border-mainAccent text-white hover:bg-mainAccent hover:text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform-gpu"
                data-cy="about"
              >
                Over ons
              </Button>
            </Link>
          </div>
        </div>

        {/* Articles Section - Carousel */}
        {!loading && articles.length > 0 && (
          <div className="max-w-7xl mx-auto">

            {/* Desktop: Title and Button aligned with articles */}
            <div className="hidden md:flex items-center gap-4 mb-8">
              <div className="w-12"></div>
              <div className="flex-1 grid gap-6" style={{
                gridTemplateColumns: `repeat(${articlesPerView + 1}, 1fr)`
              }}>
                <div className="flex items-center">
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">Newsfeed</h2>
                </div>
                {Array.from({ length: articlesPerView - 1 }, (_, i) => (
                  <div key={i}></div>
                ))}
                <div className="flex justify-end">
                  <Link href="/articles">
                    <Button 
                      variant="outline" 
                      className="bg-white/5 backdrop-blur-md border-white/15 text-white hover:bg-white/15 hover:border-mainAccent/50 hover:text-mainAccent transition-all duration-300"
                    >
                      Alle artikels
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="w-12"></div>
            </div>

            <div className="flex items-center gap-4 px-4 md:px-0">
              <Button
                onClick={goToPrev}
                disabled={articles.length <= articlesPerView}
                variant="ghost"
                size="icon"
                className="text-white hover:text-mainAccent hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 h-12 w-12"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <div className="flex-1 grid gap-6" style={{
                gridTemplateColumns: `repeat(${articlesPerView}, 1fr)`
              }}>
                {displayedArticles.map((article) => (
                  <Link 
                    key={article.article_id} 
                    href={`/articles/${article.article_id}`}
                    className="group"
                  >
                    <Card 
                      className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 hover:shadow-2xl border-white/30 hover:border-mainAccent/50 h-full flex flex-col"
                    >
                      <CardHeader className="pb-2 flex-grow">
                        <CardTitle className="text-lg leading-tight text-white mb-3 group-hover:text-mainAccent transition-colors">
                          {article.title}
                        </CardTitle>
                        <p className="text-sm text-white/80 line-clamp-6">
                          {article.excerpt || getTextPreview(article.content)}
                        </p>
                      </CardHeader>
                      
                      <CardContent className="pt-0 pb-4 mt-auto">
                        <div className="flex items-center gap-3 text-xs text-white/70">
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
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <Button
                onClick={goToNext}
                disabled={articles.length <= articlesPerView}
                variant="ghost"
                size="icon"
                className="text-white hover:text-mainAccent hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 h-12 w-12"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HeroHomepage
