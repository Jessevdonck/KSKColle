import { interviews } from "@/data/interviews"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Calendar, BookOpen } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function InterviewsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="text-center">
            <div className="bg-mainAccent/10 p-2 rounded-lg inline-flex mb-2">
              <BookOpen className="h-6 w-6 text-mainAccent" />
            </div>
            <h1 className="text-2xl font-bold text-textColor mb-1.5">Interviews</h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Ontdek de verhalen achter onze clubleden. Van ervaren schakers tot bestuurders, iedereen heeft een uniek
              verhaal te vertellen over hun schaakpassie.
            </p>
          </div>
        </div>
      </div>

      {/* Interviews Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviews.map((interview) => (
            <Card key={interview.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow border-neutral-200">
              <div className="relative h-40">
                <Image
                  src={interview.imageUrl || "/placeholder.svg"}
                  alt={interview.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="text-base font-bold text-textColor mb-2">{interview.title}</h3>

                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <User className="h-3.5 w-3.5" />
                  <span>{interview.author}</span>
                </div>

                <p className="text-gray-600 mb-3 text-sm line-clamp-3">{interview.excerpt}</p>

                <Link href={`/interviews/${interview.id}`}>
                  <Button variant="accent" className="w-full">Lees volledig interview</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
