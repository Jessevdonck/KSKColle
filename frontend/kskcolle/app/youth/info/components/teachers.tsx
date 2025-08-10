import Image from "next/image"
import { User, Mail } from "lucide-react"

type Teacher = {
  name: string
  role: string
  steps: string
  image?: string
  email?: string
}

const teachers: Teacher[] = [
  {
    name: "Ronny Eelen",
    role: "Verantwoordelijke Jeugdwerking",
    steps: "Stap X",
    image: "/images/image_placeholder.png",
  },
  {
    name: "Lesgever 1",
    role: "Trainer",
    steps: "Stap X",
    image: "/images/image_placeholder.png",
  },
  {
    name: "Lesgever 2",
    role: "Trainer",
    steps: "Stap X",
    image: "/images/image_placeholder.png",
  },
  {
    name: "Lesgever 3",
    role: "Trainer",
    steps: "X",
    image: "/images/image_placeholder.png",
  },
]

export default function Teachers() {
  return (
    <section>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="h-5 w-5" />
            Lesgevers
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {teachers.map((t, i) => (
              <div
                key={i}
                className="group bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-4 text-center border border-neutral-200 hover:border-mainAccent/30 hover:shadow-md transition-all duration-300"
              >
                <div className="relative mb-3">
                  <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-mainAccent/10 border-3 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={t.image || "/placeholder.svg?height=96&width=96&query=avatar"}
                      alt={`Foto van ${t.name}`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-textColor mb-1 group-hover:text-mainAccent transition-colors">
                  {t.name}
                </h3>
                <p className="text-xs text-mainAccent font-medium mb-1">{t.role}</p>
                <p className="text-xs text-gray-600 mb-2">{t.steps}</p>
                {t.email && (
                  <div className="flex justify-center">
                    <a
                      href={`mailto:${t.email}`}
                      className="inline-flex items-center gap-1 text-xs text-mainAccent hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {t.email}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
