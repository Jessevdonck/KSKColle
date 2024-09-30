import React from 'react'
import { Trophy, Users, SunIcon} from 'lucide-react'

const activities = [
    { icon: <Trophy className="w-12 h-12 text-[#B17457]" />, title: "Competities", description: "We organiseren het hele jaar door competities tussen clubleden!" },
    { icon: <Users className="w-12 h-12 text-[#B17457]" />, title: "Jeugdwerking", description: "Elke donderdag van 18:30 tot 19:45 worden er schaaklessen gegeven door ervaren schakers!" },
    { icon: <SunIcon className="w-12 h-12 text-[#B17457]" />, title: "Zomerkampen", description: "Tijdens de zomer van 2024 organiseert Schaakclub KSK Colle samen met de stad Sint-Niklaas een zomerkamp schaken." },
  ]

const Activities = () => {
  return ( 
    <section className="mb-16">
      <h2 className="text-3xl font-bold text-[#4A4947] mb-6">Onze Activiteiten</h2>
      <div className="flex flex-wrap justify-center gap-8">
        {activities.map((activity, index) => (
          <div key={index} className="flex flex-col items-center text-center w-64 p-4 bg-white rounded-lg shadow-md">
            {activity.icon}
            <h3 className="text-xl font-semibold text-[#4A4947] mt-4 mb-2">{activity.title}</h3>
            <p className="text-[#4A4947]">{activity.description}</p>
          </div>
        ))}
      </div>
    </section>

  )
}

export default Activities