import { Trophy, Users, Sun } from "lucide-react"

const activities = [
  {
    icon: Trophy,
    title: "Competities",
    description: "We organiseren het hele jaar door competities tussen clubleden!",
    color: "from-blue-500 to-blue-600",
    bgColor: "from-blue-50 to-blue-100",
  },
  {
    icon: Users,
    title: "Jeugdwerking",
    description: "Elke donderdag van 18:30 tot 19:45 worden er schaaklessen gegeven!",
    color: "from-green-500 to-green-600",
    bgColor: "from-green-50 to-green-100",
  },
  {
    icon: Sun,
    title: "Zomerkampen",
    description: "In de zomer organiseert Schaakclub KSK Colle een zomerkamp schaken.",
    color: "from-yellow-500 to-yellow-600",
    bgColor: "from-yellow-50 to-yellow-100",
  },
]

const Activities = () => {
  return (
    <section>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Onze Activiteiten
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activities.map((activity, index) => {
              const IconComponent = activity.icon
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-lg border border-neutral-200 hover:border-mainAccent/30 transition-all duration-300 hover:shadow-md"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${activity.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />
                  <div className="relative p-3 text-center">
                    <div
                      className={`inline-flex p-2.5 rounded-full bg-gradient-to-br ${activity.color} mb-2 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-textColor mb-1 group-hover:text-mainAccent transition-colors">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{activity.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Activities
