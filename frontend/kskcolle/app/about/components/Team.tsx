import Image from "next/image"
import { User, Mail, Phone } from "lucide-react"

const teamMembers = [
  { name: "Niels Ongena", role: "Voorzitter", image: "/images/image_placeholder.png" },
  { name: "Patrick Gillis", role: "Secretaris", image: "/images/image_placeholder.png" },
  { name: "Maarten Covents", role: "Penningmeester", image: "/images/image_placeholder.png" },
  { name: "Ronny Eelen", role: "Verantwoordelijke jeugdwerking", image: "/images/image_placeholder.png" },
  { name: "Thomas Buys-Devillé", role: "Materiaalmeester", image: "/images/image_placeholder.png" },
]

const Team = () => {
  return (
    <section>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="h-6 w-6" />
            Ons Team
          </h2>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-6 text-center border border-neutral-200 hover:border-mainAccent/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative mb-4">
                  <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-mainAccent/10 border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={`Foto van ${member.name}`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-textColor mb-2 group-hover:text-mainAccent transition-colors">
                  {member.name}
                </h3>

                <p className="text-sm text-mainAccent font-medium mb-3">{member.role}</p>

                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="p-2 rounded-full bg-mainAccent/10 hover:bg-mainAccent/20 transition-colors">
                    <Mail className="h-4 w-4 text-mainAccent" />
                  </button>
                  <button className="p-2 rounded-full bg-mainAccent/10 hover:bg-mainAccent/20 transition-colors">
                    <Phone className="h-4 w-4 text-mainAccent" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Team
