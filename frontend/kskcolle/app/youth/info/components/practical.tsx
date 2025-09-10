import { Clock, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function Practical() {
  return (
    <section className="py-2">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Praktische info</h2>
        <p className="text-base text-gray-600 max-w-2xl mx-auto">
          Kom kennismaken tijdens onze jeugduren. Iedereen welkom!
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
                  <p className="text-gray-600">Donderdag: Stap 1 om 19:00u, andere stappen om 18:30u — 19:45u (niet in schoolvakanties)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Waar</h3>
                  <p className="text-gray-600">Taverne De Graanmaat — zaal 4 achteraan</p>
                  <p className="text-sm text-gray-500">Sint-Niklaas</p>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-800 text-center text-sm">
                  <strong>Nieuwe jeugdleden welkom!</strong> Instappen kan op elk moment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
