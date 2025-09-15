"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ExternalLink, User } from "lucide-react"
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
    <section className="py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Interviews met Clubleden</h2>
        <p className="text-base text-gray-600 max-w-2xl mx-auto">
        Ontdek de verhalen achter onze clubleden. Van ervaren schakers tot bestuurders, ontdek hier de verhalen die schuilen achter onze clubleden.
        </p>
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Carousel */}
        <Card className="overflow-hidden shadow-md">
          <CardContent className="p-0">
            <div className="md:flex">
              {/* Image */}
              <div className="md:w-1/3 relative h-48 md:h-auto">
                <Image
                  src={currentInterview.imageUrl || "/placeholder.svg"}
                  alt={currentInterview.name}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Content */}
              <div className="md:w-2/3 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{currentInterview.title}</h3>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={prevInterview} className="h-7 w-7 p-0 bg-transparent">
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-gray-500 px-2">
                      {currentIndex + 1} / {interviews.length}
                    </span>
                    <Button variant="outline" size="sm" onClick={nextInterview} className="h-7 w-7 p-0 bg-transparent">
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {/* Author info */}
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
                  <User className="h-3 w-3" />
                  <span>{currentInterview.author}</span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-4 text-sm">{currentInterview.excerpt}</p>
                <Link href={`/interviews/${currentInterview.id}`}>
                  <Button className="inline-flex items-center gap-2 bg-mainAccent hover:bg-mainAccentDark text-sm">
                    Lees volledig interview
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dots indicator */}
        <div className="flex justify-center mt-4 gap-1">
          {interviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
