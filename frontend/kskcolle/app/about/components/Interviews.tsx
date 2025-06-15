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
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Interviews met Clubleden</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Ontdek de verhalen achter onze clubleden. Van ervaren schakers tot bestuurders, iedereen heeft een uniek
          verhaal te vertellen over hun schaakpassie.
        </p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Carousel */}
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="md:flex">
              {/* Image */}
              <div className="md:w-1/3 relative h-64 md:h-auto">
                <Image
                  src={currentInterview.imageUrl || "/placeholder.svg"}
                  alt={currentInterview.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="md:w-2/3 p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{currentInterview.title}</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={prevInterview} className="h-8 w-8 p-0">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-500 px-2">
                      {currentIndex + 1} / {interviews.length}
                    </span>
                    <Button variant="outline" size="sm" onClick={nextInterview} className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                     
                </div>
                {/* Author info */}
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{currentInterview.author}</span>
                </div>

                <p className="text-gray-600 mb-6 line-clamp-4">{currentInterview.excerpt}</p>

                <Link href={`/interviews/${currentInterview.id}`}>
                  <Button className="inline-flex items-center gap-2 bg-mainAccent hover:bg-mainAccentDark">
                    Lees volledig interview
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dots indicator */}
        <div className="flex justify-center mt-6 gap-2">
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
