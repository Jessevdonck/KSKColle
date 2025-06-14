"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Crown } from "lucide-react"

const presidents = [
  { name: "Robert Pauwels", period: "1944 - 1969" },
  { name: "Leon Coppens", period: "1969 - 1994" },
  { name: "Marc Weyns", period: "1994 - 2001" },
  { name: "Wim Weyers", period: "2001 - 2019" },
  { name: "Bart Schittekat", period: "2019 - 2023" },
  { name: "Niels Ongena", period: "2023 - heden" },
]

export default function PresidentsTimeline() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 10)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    const handleResize = () => {
      checkScrollButtons()
    }

    checkScrollButtons()
    window.addEventListener("resize", handleResize)

    const scrollElement = scrollRef.current
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScrollButtons)
      return () => {
        scrollElement.removeEventListener("scroll", checkScrollButtons)
        window.removeEventListener("resize", handleResize)
      }
    }

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 250
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const scrollToEnd = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: "smooth",
      })
    }
  }

  const scrollToStart = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: 0,
        behavior: "smooth",
      })
    }
  }

  return (
    <section>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Crown className="h-6 w-6" />
              Onze Voorzitters
            </h2>

            <div className="flex gap-2">
              <button
                onClick={scrollToStart}
                disabled={!canScrollLeft}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title="Naar begin"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title="Scroll links"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title="Scroll rechts"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={scrollToEnd}
                disabled={!canScrollRight}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title="Naar einde (huidige voorzitter)"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="text-white/80 mt-2 text-sm">Scroll horizontaal om alle voorzitters te zien</p>
        </div>

        <div className="p-8">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-mainAccent to-mainAccentDark top-12 rounded-full" />

            {/* Scrollable container */}
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#B17457 #f1f1f1",
              }}
            >
              {presidents.map((president, index) => (
                <div key={index} className="flex flex-col items-center flex-shrink-0 w-48 group">
                  {/* Timeline dot */}
                  <div className="relative z-10 mb-6">
                    <div className="w-6 h-6 bg-gradient-to-br from-mainAccent to-mainAccentDark rounded-full border-4 border-white shadow-lg group-hover:scale-125 transition-transform duration-300" />
                  </div>

                  {/* Content card */}
                  <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-4 text-center border border-neutral-200 group-hover:border-mainAccent/30 group-hover:shadow-md transition-all duration-300 w-full">
                    <time className="text-sm font-semibold text-mainAccent mb-2 block">{president.period}</time>
                    <h3 className="text-base font-bold text-textColor group-hover:text-mainAccent transition-colors leading-tight">
                      {president.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll indicators */}
            <div className="flex justify-center mt-4 gap-2">
              {presidents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (scrollRef.current) {
                      const itemWidth = 192 + 24 
                      scrollRef.current.scrollTo({
                        left: index * itemWidth,
                        behavior: "smooth",
                      })
                    }
                  }}
                  className="w-2 h-2 rounded-full bg-mainAccent/30 hover:bg-mainAccent transition-colors"
                  title={`Ga naar ${presidents[index].name}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
