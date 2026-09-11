import { Clock, MapPin, CalendarClock } from "lucide-react"

export default function ClubInfo() {
  return (
    <section>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Clubavond
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-mainAccent/10 p-2 rounded-full">
                <Clock className="h-5 w-5 text-mainAccent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-textColor">Wanneer</h3>
                <p className="text-sm text-gray-600">Elke donderdag om 20:00</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-mainAccent/10 p-2 rounded-full">
                <MapPin className="h-5 w-5 text-mainAccent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-textColor">Waar</h3>
                <p className="text-sm text-gray-600">Café De Graanmaat, Grote Markt, Sint-Niklaas</p>
              </div>
            </div>
          </div>
          <div className="bg-mainAccent/10 p-2.5 rounded-lg">
            <p className="text-textColor text-center text-sm">
              <strong>Nieuwe leden welkom!</strong> Kom gerust langs voor een kennismaking.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
