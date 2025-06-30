import { Clock, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ClubInfo() {
  return (
    <section className="py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Clubavond</h2>
        <p className="text-base text-gray-600 max-w-2xl mx-auto">
          Kom langs op onze wekelijkse clubavond en ontmoet andere schaakliefhebbers
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
                  <p className="text-gray-600">Elke donderdag om 20:00</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Waar</h3>
                  <p className="text-gray-600">Café De Graanmaat</p>
                  <p className="text-sm text-gray-500">Grote Markt, Sint-Niklaas</p>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-800 text-center text-sm">
                  <strong>Nieuwe leden welkom!</strong> Kom gerust langs voor een kennismaking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
