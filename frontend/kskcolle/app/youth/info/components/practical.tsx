import { Clock, MapPin, Info } from "lucide-react"

export default function Practical() {
  return (
    <section>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2.5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Info className="h-4 w-4" />
            Praktische info
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-mainAccent/10 p-2 rounded-full">
                <Clock className="h-5 w-5 text-mainAccent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-textColor">Wanneer</h3>
                <p className="text-sm text-gray-600">Dinsdag om 17:30u tot 18:30u: Stap 1 &amp; 2</p>
                <p className="text-sm text-gray-600">Donderdag om 18:30u tot 19:45u: Stap 3 &amp; 4</p>
                <p className="text-sm text-gray-500">Niet in schoolvakanties</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-mainAccent/10 p-2 rounded-full">
                <MapPin className="h-5 w-5 text-mainAccent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-textColor">Waar</h3>
                <p className="text-sm text-gray-600">Bibliotheek Sint-Niklaas — Wonderbar op de eerste verdieping</p>
                <p className="text-sm text-gray-600">Taverne De Graanmaat — zaal 4 achteraan</p>
                <p className="text-sm text-gray-500">Sint-Niklaas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
