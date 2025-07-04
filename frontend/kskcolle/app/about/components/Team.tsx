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
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="h-5 w-5" />
            Ons Team
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-4 text-center border border-neutral-200 hover:border-mainAccent/30 hover:shadow-md transition-all duration-300"
              >
                <div className="relative mb-3">
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-mainAccent/10 border-3 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={`Foto van ${member.name}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-textColor mb-1 group-hover:text-mainAccent transition-colors">
                  {member.name}
                </h3>
                <p className="text-xs text-mainAccent font-medium mb-2">{member.role}</p>
                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="p-1.5 rounded-full bg-mainAccent/10 hover:bg-mainAccent/20 transition-colors">
                    <Mail className="h-3 w-3 text-mainAccent" />
                  </button>
                  <button className="p-1.5 rounded-full bg-mainAccent/10 hover:bg-mainAccent/20 transition-colors">
                    <Phone className="h-3 w-3 text-mainAccent" />
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
