"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ExternalLink, User, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { interviews } from "@/data/interviews"
import Link from "next/link"
import Image from "next/image"

export default function Interviews() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextInterview = () => {
    setCurrentIndex((prev) => (prev + 1) % interviews.length)
  }

  const prevInterview = () => {
    setCurrentIndex((prev) => (prev - 1 + interviews.length) % interviews.length)
  }

  const currentInterview = interviews[currentIndex]

  return (
    <section>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Interviews met Clubleden
          </h2>
        </div>

        <div className="p-4">
          <div className="relative max-w-3xl mx-auto">
            <Card className="overflow-hidden shadow-sm border-neutral-200">
              <CardContent className="p-0">
                <div className="md:flex">
                  {/* Image */}
                  <div className="md:w-1/3 relative h-40 md:h-auto">
                    <Image
                      src={currentInterview.imageUrl || "/placeholder.svg"}
                      alt={currentInterview.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Content */}
                  <div className="md:w-2/3 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-textColor">{currentInterview.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="outline" size="sm" onClick={prevInterview} className="h-6 w-6 p-0 bg-transparent">
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-gray-500 px-1">
                          {currentIndex + 1} / {interviews.length}
                        </span>
                        <Button variant="outline" size="sm" onClick={nextInterview} className="h-6 w-6 p-0 bg-transparent">
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {/* Author info */}
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                      <User className="h-3 w-3" />
                      <span>{currentInterview.author}</span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-4 text-sm">{currentInterview.excerpt}</p>
                    <Link href={`/interviews/${currentInterview.id}`}>
                      <Button variant="accent" size="sm" className="inline-flex items-center gap-2">
                        Lees volledig interview
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dots indicator */}
            <div className="flex justify-center mt-3 gap-1">
              {interviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? "bg-mainAccent" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
