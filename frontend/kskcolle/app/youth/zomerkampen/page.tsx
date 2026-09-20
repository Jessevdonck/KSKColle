"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Users, Euro, ExternalLink, Phone, Mail } from "lucide-react"

export default function ZomerkampenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-textColor">Zomerkampen schaken 2026</h1>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-3">

          {/* Introduction */}
          <Card className="border-mainAccent/20 shadow-md">
            <CardContent className="p-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                Tijdens de zomer van 2026 organiseert Schaakclub KSK Colle samen met de stad Sint-Niklaas twee zomerkampen schaken.
              </p>
            </CardContent>
          </Card>

          {/* Location and Schedule */}
          <Card className="border-mainAccent/20 shadow-md">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center text-mainAccent text-base">
                <MapPin className="mr-2" size={18} />
                Locatie & Schema
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="mr-2.5 text-mainAccent mt-0.5" size={16} />
                  <div>
                    <p className="font-semibold text-sm">HQ Gaming Club</p>
                    <p className="text-gray-600 text-sm">Lamstraat 38, 9100 Sint-Niklaas</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="mr-2.5 text-mainAccent mt-0.5" size={16} />
                  <div>
                    <p className="font-semibold text-sm">Tijdstip</p>
                    <p className="text-gray-600 text-sm">Dagelijks van 10.00 uur tot 12.00 uur</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="border-mainAccent/20 shadow-md">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center text-mainAccent text-base">
                <Calendar className="mr-2" size={18} />
                Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <p className="font-semibold text-blue-800 mb-0.5 text-sm">Kamp 1</p>
                  <p className="text-blue-700 text-sm">1 – 3 juli 2026</p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <p className="font-semibold text-blue-800 mb-0.5 text-sm">Kamp 2</p>
                  <p className="text-blue-700 text-sm">6 – 10 juli 2026</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Who can participate */}
          <Card className="border-mainAccent/20 shadow-md">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center text-mainAccent text-base">
                <Users className="mr-2" size={18} />
                Wie mag deelnemen?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-start">
                <div className="w-1.5 h-1.5 bg-mainAccent rounded-full mt-1.5 mr-2.5 flex-shrink-0"></div>
                <p className="text-gray-700 text-sm">
                  Iedereen geboren in 2014 tot en met 2019 (lagere schoolleeftijd). Het aantal deelnemers zal begrensd worden op 20 deelnemers per kamp.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What to expect */}
          <Card className="border-mainAccent/20 shadow-md">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center text-mainAccent text-base">
                <Users className="mr-2" size={18} />
                Wat mag je verwachten?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-start">
                <div className="w-1.5 h-1.5 bg-mainAccent rounded-full mt-1.5 mr-2.5 flex-shrink-0"></div>
                <p className="text-gray-700 text-sm">
                  Ervaren schaakleraars zullen schaaklessen geven op verschillende niveaus, van de absolute beginselen van het schaken tot gevorderde lessen. Daarnaast zal er ook tijd zijn om de aangeleerde schaakvaardigheden in te zetten in onderlinge schaakpartijen.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Registration */}
          <Card className="border-mainAccent/20 shadow-md">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center text-mainAccent text-base">
                <ExternalLink className="mr-2" size={18} />
                Waar kan je inschrijven?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-mainAccent rounded-full mt-1.5 mr-2.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-gray-700 text-sm mb-2">
                      Inschrijven gebeurt via de stad Sint-Niklaas:
                    </p>
                    <Button
                      asChild
                      variant="accent"
                      size="sm"
                    >
                      <a
                        href="https://www.sint-niklaas.be/vakantieopmaat"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2" size={16} />
                        www.sint-niklaas.be/vakantieopmaat
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <p className="font-semibold text-yellow-800 mb-1.5 text-sm">Meer info vind je hier:</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center">
                      <Phone className="mr-2 text-yellow-700" size={14} />
                      <a
                        href="tel:037783750"
                        className="text-yellow-700 hover:underline font-medium text-sm"
                      >
                        03 778 37 50
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Mail className="mr-2 text-yellow-700" size={14} />
                      <a
                        href="mailto:sportkampen@sint-niklaas.be"
                        className="text-yellow-700 hover:underline font-medium text-sm"
                      >
                        sportkampen@sint-niklaas.be
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price */}
          <Card className="border-mainAccent/20 shadow-md">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center text-mainAccent text-base">
                <Euro className="mr-2" size={18} />
                Hoeveel kost het schaakkamp?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600 mb-1">Kamp 1 · 1 – 3 juli</p>
                  <p className="text-xl font-bold text-textColor">€ 15</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600 mb-1">Kamp 2 · 6 – 10 juli</p>
                  <p className="text-xl font-bold text-textColor">€ 25</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
