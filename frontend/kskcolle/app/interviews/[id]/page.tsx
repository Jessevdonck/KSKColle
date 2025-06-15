import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { interviews } from "@/data/interviews"
import Link from "next/link"
import Image from "next/image"

interface InterviewPageProps {
  params: {
    id: string
  }
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const interview = interviews.find((i) => i.id === params.id)

  if (!interview) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/about">
            <Button variant="ghost" className="mb-4 -ml-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Over Ons
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={interview.imageUrl || "/placeholder.svg"}
                alt={interview.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{interview.title}</h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {interview.author}
                </div>
              </div>

              <p className="text-gray-600 text-lg">{interview.excerpt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: interview.content
                  .replace(/\n\n/g, "</p><p>")
                  .replace(/\n/g, "<br>")
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export async function generateStaticParams() {
  return interviews.map((interview) => ({
    id: interview.id,
  }))
}

export async function generateMetadata({ params }: InterviewPageProps) {
  const interview = interviews.find((i) => i.id === params.id)

  if (!interview) {
    return {
      title: "Interview niet gevonden",
    }
  }

  return {
    title: `${interview.title} | KSK Colle Sint-Niklaas`,
    description: interview.excerpt,
  }
}
