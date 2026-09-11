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
    steps: "Stap 2",
    image: "/images/image_placeholder.png",
  },
  {
    name: "Ruud Vermeulen",
    role: "Trainer",
    steps: "Stap 1",
    image: "/images/image_placeholder.png",
  },
  {
    name: "Diego Poeck",
    role: "Trainer",
    steps: "Stap 1+2",
    image: "/images/image_placeholder.png",
  },
  {
    name: "Sven Schatteman",
    role: "Trainer",
    steps: "Stap 3+4",
    image: "/images/image_placeholder.png",
  },
  {
    name: "Patrick Gillis",
    role: "Trainer",
    steps: "Stap 1",
    image: "/images/Bestuur/PatrickGillis.jpg",
  },
]

export default function Teachers() {
  return (
    <section>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="h-4 w-4" />
            Lesgevers
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {teachers.map((t, i) => (
              <div
                key={i}
                className="group bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-3 text-center border border-neutral-200 hover:border-mainAccent/30 hover:shadow-md transition-all duration-300"
              >
                <div className="relative mb-2">
                  <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-mainAccent/10 border-3 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={t.image || "/placeholder.svg?height=96&width=96&query=avatar"}
                      alt={`Foto van ${t.name}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-textColor mb-0.5 group-hover:text-mainAccent transition-colors">
                  {t.name}
                </h3>
                <p className="text-xs text-mainAccent font-medium mb-0.5">{t.role}</p>
                <p className="text-xs text-gray-600 mb-1.5">{t.steps}</p>
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
