"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, Calendar, User, ArrowRight, ChevronLeft, Puzzle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getRecentArticles } from "../api/index"
import { Article } from "../../data/article"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

const HeroHomepage = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  // Removed commentCounts to reduce API calls - comment counts not critical for homepage

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
      case 'tablet': return 1  // ook 1 op tablet, alleen desktop toont 3
      case 'desktop': return 3
      default: return 3
    }
  }

  const fetchRecentArticles = async () => {
    try {
      const data = await getRecentArticles(12) // Fetch more articles for carousel
      setArticles(data)
      // Skip comment counts to reduce API calls - they're not critical for homepage
      // Comment counts can be shown on article detail pages instead
      // Comment counts removed to reduce API calls
    } catch (error) {
      console.error("Error fetching recent articles:", error)
    } finally {
      setLoading(false)
    }
  }

  const articlesPerView = getArticlesPerView()
  const showPuzzleThumb = screenSize === 'desktop'
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
      <div className="container mx-auto px-4 relative z-10 flex flex-col justify-center min-h-[calc(100vh-5rem)] py-8">
        {/* Welcome Section - Naar boven verplaatst */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-6">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-5xl tracking-tight leading-tight drop-shadow-2xl">
              Welkom bij{" "}
              <span
                className="block mt-4 text-mainAccent font-black"
                style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.8)" }}
              >
                KSK Colle
              </span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-white font-medium drop-shadow-lg">
              De gezelligste schaakclub van het Waasland!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href={"#contact"}>
              <Button
                size="lg"
                className="bg-mainAccent text-white hover:bg-mainAccentDark font-semibold px-6 py-3 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform-gpu"
                data-cy="contact"
              >
                Contact
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link href={"/about"}>
              <Button
                variant="outline"
                size="lg"
                className="bg-black/50 border-2 border-white/60 hover:border-mainAccent text-white hover:bg-mainAccent hover:text-white font-semibold px-6 py-3 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform-gpu"
                data-cy="about"
              >
                Over ons
              </Button>
            </Link>
          </div>
        </div>

        {/* Articles Section - Carousel */}
        {!loading && articles.length > 0 && (
          <div className="w-full flex justify-center">
            <div className="flex flex-col items-center" style={{
              maxWidth: 'calc(100vw - 2rem)'
            }}>

              {/* Desktop: Title and Button aligned with articles; optional Puzzel header when puzzle thumb shown */}
              <div className="hidden md:flex items-center gap-2 mb-3 w-full">
                <div className="w-10 shrink-0"></div>
                <div className="flex-1 grid gap-4" style={{
                  gridTemplateColumns: showPuzzleThumb ? 'repeat(3, minmax(0, 1fr)) 200px' : `repeat(${articlesPerView}, 1fr)`
                }}>
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">Newsfeed</h2>
                  </div>
                  {Array.from({ length: showPuzzleThumb ? 1 : articlesPerView - 2 }, (_, i) => (
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
                  {showPuzzleThumb && (
                    <div className="flex items-center">
                      <h2 className="text-lg font-bold text-white drop-shadow-lg">Puzzel</h2>
                    </div>
                  )}
                </div>
                <div className="w-10 shrink-0"></div>
              </div>

              {/* Mobile: Title and Button */}
              <div className="md:hidden flex items-center justify-between mb-3 px-3 w-full">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">Newsfeed</h2>
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

              <div className="flex items-center gap-1 sm:gap-2 w-full px-1 sm:px-0">
                <Button
                  onClick={goToPrev}
                  disabled={articles.length <= articlesPerView}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-mainAccent hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 h-10 w-10 touch-manipulation"
                  aria-label="Vorige artikel"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex-1 min-w-0 grid gap-2 md:gap-4 items-stretch" style={{
                  gridTemplateColumns: showPuzzleThumb ? 'repeat(3, minmax(0, 1fr)) 200px' : `repeat(${articlesPerView}, 1fr)`
                }}>
                {displayedArticles.map((article) => (
                  <Link 
                    key={article.article_id} 
                    href={`/articles/${article.article_id}`}
                    className="group h-full min-h-[260px] md:min-h-[280px] flex"
                  >
                    <Card 
                      className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 hover:shadow-2xl border-white/30 hover:border-mainAccent/50 h-full min-h-[260px] md:min-h-[280px] flex flex-col overflow-hidden w-full"
                    >
                      {/* Image Section - fixed height for consistent card height */}
                      {article.image_urls && article.image_urls.length > 0 && (
                        <div className="relative w-full h-36 shrink-0 overflow-hidden transition-opacity duration-300 group-hover:opacity-0">
                          <Image
                            src={article.image_urls[0]}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            quality={80}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      )}
                      
                      {/* Content: slide-up only when there is an image; line-clamp keeps height consistent */}
                      {article.image_urls && article.image_urls.length > 0 ? (
                        <div className="flex-grow min-h-0 transition-transform duration-300 group-hover:-translate-y-36">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg leading-tight text-white mb-2 line-clamp-2 group-hover:text-mainAccent transition-colors">
                              {article.title}
                            </CardTitle>
                            <p className="text-sm text-white/80 line-clamp-3">
                              {article.excerpt || getTextPreview(article.content, 300)}
                            </p>
                          </CardHeader>
                        </div>
                      ) : (
                        <CardHeader className="pb-2 flex-grow min-h-0">
                          <CardTitle className="text-lg leading-tight text-white mb-2 line-clamp-2 group-hover:text-mainAccent transition-colors">
                            {article.title}
                          </CardTitle>
                          <p className="text-sm text-white/80 line-clamp-3">
                            {article.excerpt || getTextPreview(article.content, 140)}
                          </p>
                        </CardHeader>
                      )}
                      
                      {/* Footer stays anchored at the bottom */}
                      <CardContent className="pt-0 pb-2 mt-auto">
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
                          {/* Comment count removed to reduce API calls */}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {showPuzzleThumb && (
                  <Link href="/#puzzel" className="group h-full min-h-[260px] md:min-h-[280px] flex">
                    <Card className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 hover:shadow-2xl border-white/30 hover:border-mainAccent/50 h-full min-h-[260px] md:min-h-[280px] flex flex-col overflow-hidden w-full">
                      <div className="flex flex-col items-center justify-center flex-grow p-4 text-center">
                        <div className="mb-2 p-2 rounded-lg bg-mainAccent/20 group-hover:bg-mainAccent/30 transition-colors">
                          <Puzzle className="h-10 w-10 text-mainAccent" />
                        </div>
                        <CardTitle className="text-base leading-tight text-white mb-1 group-hover:text-mainAccent transition-colors">
                          Puzzel van de dag
                        </CardTitle>
                        <p className="text-xs text-white/80">
                          Probeer de schaakpuzzel
                        </p>
                      </div>
                      <CardContent className="pt-0 pb-3 mt-auto flex justify-center">
                        <span className="text-xs text-white/70 inline-flex items-center gap-1">
                          Naar puzzel <ChevronRight className="h-3 w-3" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </div>

              <Button
                onClick={goToNext}
                disabled={articles.length <= articlesPerView}
                variant="ghost"
                size="icon"
                className="text-white hover:text-mainAccent hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 h-10 w-10 touch-manipulation"
                aria-label="Volgende artikel"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

              {/* Mobile/tablet: carousel dot indicators */}
              {(screenSize === 'mobile' || screenSize === 'tablet') && articles.length > articlesPerView && (
                <div className="flex justify-center gap-1.5 mt-3 flex-wrap" role="tablist" aria-label="Artikel in carousel">
                  {Array.from({ length: Math.ceil(articles.length / articlesPerView) }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={Math.floor(currentIndex / articlesPerView) === i}
                      aria-label={`Pagina ${i + 1} van ${Math.ceil(articles.length / articlesPerView)}`}
                      onClick={() => setCurrentIndex(i * articlesPerView)}
                      className={`shrink-0 w-2.5 h-2.5 rounded-full transition-colors touch-manipulation ${Math.floor(currentIndex / articlesPerView) === i ? 'bg-mainAccent scale-110' : 'bg-white/40 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HeroHomepage
