import React from 'react'
import Image from 'next/image'

const teamMembers = [
    { name: "Niels Ongena", role: "Voorzitter", image: "/images/image_placeholder.png" },
    { name: "Patrick Gillis", role: "Secretaris", image: "/images/image_placeholder.png" },
    { name: "Maarten Covents", role: "Penningmeester", image: "/images/image_placeholder.png" },
    { name: "Ronny Eelen", role: "Verantwoordelijke jeugdwerking", image: "/images/image_placeholder.png" },
    { name: "Thomas Buys-Devillé", role: "Materiaalmeester", image: "/images/image_placeholder.png" },
  ]

const Team = () => {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold text-[#4A4947] mb-6">Ons Team</h2>
      <div className="flex flex-wrap justify-center gap-8">
        {teamMembers.map((member, index) => (
          <div key={index} className="flex flex-col items-center w-48 p-4 bg-white shadow-md">
            <Image
              src={member.image}
              alt={`Foto van ${member.name}`}
              width={150}
              height={150}
              className="rounded-sm mb-4"
            />
            <h3 className="text-xl font-semibold text-[#4A4947] text-center">{member.name}</h3>
            <p className="text-emerald-800 text-center">{member.role}</p>
          </div>
        ))}
      </div>
    </section>

  )
}

export default Team