"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Users, Euro, ExternalLink, Phone, Mail } from "lucide-react"

export default function ZomerkampenPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Zomerkampen schaken 2026</h1>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Introduction */}
          <Card className="border-mainAccent/20 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                Tijdens de zomer van 2026 organiseert Schaakclub KSK Colle samen met de stad Sint-Niklaas een zomerkamp schaken.
              </p>
            </CardContent>
          </Card>

          {/* Location and Schedule */}
          <Card className="border-mainAccent/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-mainAccent">
                <MapPin className="mr-2" size={24} />
                Locatie & Schema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="mr-3 text-mainAccent mt-1" size={20} />
                  <div>
                    <p className="font-semibold">HQ Gaming Club</p>
                    <p className="text-gray-600">Lamstraat 38, 9100 Sint-Niklaas</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="mr-3 text-mainAccent mt-1" size={20} />
                  <div>
                    <p className="font-semibold">Tijdstip</p>
                    <p className="text-gray-600">Dagelijks van 10.00 uur tot 12.00 uur</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="border-mainAccent/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-mainAccent">
                <Calendar className="mr-2" size={24} />
                Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="font-semibold text-blue-800 mb-2">Juli 2026</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>1 – 3 juli</li>
                    <li>6 – 10 juli</li>
                    <li>27 – 31 juli</li>
                  </ul>
                </div>
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                  <p className="font-semibold text-green-800 mb-2">Augustus 2026</p>
                  <ul className="text-green-700 space-y-1">
                    <li>3 – 7 augustus</li>
                    <li>17 – 21 augustus</li>
                    <li>24 – 28 augustus</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Who can participate */}
          <Card className="border-mainAccent/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-mainAccent">
                <Users className="mr-2" size={24} />
                Wie mag deelnemen?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-mainAccent rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    Iedereen geboren in 2010 tot en met 2017, het aantal deelnemers zal begrensd worden op 20 deelnemers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to expect */}
          <Card className="border-mainAccent/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-mainAccent">
                <Users className="mr-2" size={24} />
                Wat mag je verwachten?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-mainAccent rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    Ervaren schaakleraars zullen schaaklessen geven op verschillende niveaus, van de absolute beginselen van het schaken tot gevorderde lessen. Daarnaast zal er ook tijd zijn om de aangeleerde schaakvaardigheden in te zetten in onderlinge schaakpartijen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration */}
          <Card className="border-mainAccent/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-mainAccent">
                <ExternalLink className="mr-2" size={24} />
                Waar kan je inschrijven?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-mainAccent rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-gray-700 mb-2">
                      Inschrijven gebeurt via de stad Sint-Niklaas:
                    </p>
                    <Button 
                      asChild 
                      className="bg-mainAccent hover:bg-mainAccentDark text-white"
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
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="font-semibold text-yellow-800 mb-2">Meer info vind je hier:</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Phone className="mr-2 text-yellow-700" size={16} />
                      <a 
                        href="tel:037783750" 
                        className="text-yellow-700 hover:underline font-medium"
                      >
                        03 778 37 50
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Mail className="mr-2 text-yellow-700" size={16} />
                      <a 
                        href="mailto:sportkampen@sint-niklaas.be" 
                        className="text-yellow-700 hover:underline font-medium"
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
          <Card className="border-mainAccent/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-mainAccent">
                <Euro className="mr-2" size={24} />
                Hoeveel kost het schaakkamp?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900 mb-1">€ 45</p>
                  <p className="text-sm text-gray-600">Standaard prijs</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-800 mb-1">€ 22,50</p>
                  <p className="text-sm text-green-600">Met kansenpas</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
