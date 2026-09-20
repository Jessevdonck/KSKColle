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
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 mb-3">
            <p className="text-yellow-900 text-sm font-semibold">
              Momenteel geldt er een inschrijvingsstop voor de jeugdwerking tot september.
            </p>
          </div>

      <div className="max-w-xl mx-auto">
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Wanneer</h3>
                  <p className="text-gray-600">Dinsdag om 17:30u tot 18:30u: Stap 1 & 2</p>
                  <p className="text-gray-600">Donderdag om 18:30u tot 19:45u </p>
                  <p className="text-gray-600">niet in schoolvakanties</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Waar</h3>
                  <p className="text-gray-600">Bibliotheek Sint-Niklaas — Wonderbar op de Eerste verdieping</p>
                  <p className="text-gray-600">Taverne De Graanmaat — zaal 4 achteraan</p>
                  <p className="text-sm text-gray-500">Sint-Niklaas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-mainAccent/10 p-2.5 rounded-lg">
            <p className="text-textColor text-center text-sm">
              <strong>Let op:</strong> Door de huidige inschrijvingsstop kunnen nieuwe jeugdleden pas opnieuw instappen vanaf september.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
