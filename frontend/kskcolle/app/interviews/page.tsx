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
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Interviews</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ontdek de verhalen achter onze clubleden. Van ervaren schakers tot bestuurders, iedereen heeft een uniek
              verhaal te vertellen over hun schaakpassie.
            </p>
          </div>
        </div>
      </div>

      {/* Interviews Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {interviews.map((interview) => (
            <Card key={interview.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                <Image
                  src={interview.imageUrl || "/placeholder.svg"}
                  alt={interview.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{interview.title}</h3>

                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{interview.author}</span>
                </div>

                <p className="text-gray-600 mb-6 line-clamp-3">{interview.excerpt}</p>

                <Link href={`/interviews/${interview.id}`}>
                  <Button className="w-full bg-mainAccent hover:bg-mainAccentDark">Lees volledig interview</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
