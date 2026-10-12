import { interviews } from "@/data/interviews"
import { MessageCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function InterviewsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-5">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-textColor flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-mainAccent" />
              Interviews met Clubleden
            </h1>
            <p className="text-sm text-gray-600 mt-0.5 max-w-2xl">
              De verhalen achter onze clubleden: hoe ze het schaken ontdekten, hun mooiste partijen en herinneringen aan
              KSK Colle.
            </p>
          </div>

          {/* Raster met portretten */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {interviews.map((interview) => (
              <Link
                key={interview.id}
                href={`/interviews/${interview.id}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-200 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-lg"
              >
                <Image
                  src={interview.imageUrl || "/images/image_placeholder.png"}
                  alt={interview.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-white">
                  <h2 className="text-sm sm:text-base font-bold leading-tight drop-shadow">{interview.title}</h2>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-white/80 group-hover:text-mainAccent transition-colors">
                    Lees interview
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
