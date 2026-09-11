"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Clock, Trophy, Euro, Mail, Phone, ExternalLink, X } from "lucide-react"
import Image from "next/image"

export default function RapidtoernooiPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Rapidtoernooi Volwassenen</h1>

        </div>

        {/* Flyer */}
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setSelectedImage("/images/Ovjk/flyer-rapid-volwassenen-24-okt-2026.png")}
            className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md max-w-sm mx-auto"
          >
            <Image
              src="/images/Ovjk/flyer-rapid-volwassenen-24-okt-2026.png"
              alt="Flyer Rapidtoernooi Volwassenen 24 oktober 2026"
              width={467}
              height={690}
              className="h-auto w-full object-contain"
              priority
            />
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-4">

            {/* Date and Location */}
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <Calendar className="mr-2" size={20} />
                  Datum & Locatie
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="mr-3 text-mainAccent" size={20} />
                    <div>
                      <p className="font-semibold">Zaterdag 24 oktober 2026</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="mr-3 text-mainAccent mt-1" size={20} />
                    <div>
                      <p className="font-semibold">Campus Onze-Lieve-Vrouw-Presentatie Sint-Niklaas</p>
                      <p className="text-sm text-gray-600">Spoorweglaan 100, 9100 Sint-Niklaas</p>
                      <p className="text-xs text-gray-500 mt-1">Vlakbij station • Buslijnen 11, 16, 27, 35 • Veel parkeergelegenheid</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Format */}
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <Clock className="mr-2" size={20} />
                  Formule
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded">
                  <p className="font-semibold text-sm text-blue-800">7 rondes Rapid</p>
                  <p className="text-sm text-blue-700">10 minuten + 5 seconden per zet</p>
                </div>
              </CardContent>
            </Card>

            {/* Program */}
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <Clock className="mr-2" size={20} />
                  Programma
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">13:00</span>
                    <span>Aanmelden tot</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">13:30</span>
                    <span>Start ronde 1</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold">7 rondes</span>
                    <span>Klassiek format</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">18:00</span>
                    <span>Pauzetijdstip</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-4">

            {/* Registration Fee */}
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <Euro className="mr-2" size={20} />
                  Inschrijving
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="font-semibold text-sm">Per speler:</span>
                    <span className="text-lg font-bold text-blue-800">€10</span>
                  </div>
                  <p className="text-xs text-gray-600">Inschrijving tot 24 oktober om 12:00</p>
                </div>
              </CardContent>
            </Card>

            {/* Prizes */}
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <Trophy className="mr-2" size={20} />
                  Prijzen
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between p-2 bg-orange-50 rounded">
                    <span>1e plaats:</span>
                    <span className="font-bold">€50</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>2e plaats:</span>
                    <span className="font-bold">€40</span>
                  </div>
                  <div className="flex justify-between p-2 bg-blue-50 rounded">
                    <span>3e plaats:</span>
                    <span className="font-bold">€30</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <Mail className="mr-2" size={20} />
                  Vragen?
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <Mail className="mr-2 mt-0.5 text-mainAccent" size={14} />
                    <a
                      href="mailto:ovjk2025schaken@gmail.com"
                      className="text-mainAccent hover:underline"
                    >
                      ovjk2025schaken@gmail.com
                    </a>
                  </div>

                  <div className="flex items-start">
                    <Phone className="mr-2 mt-0.5 text-mainAccent" size={14} />
                    <a
                      href="tel:0472080886"
                      className="text-mainAccent hover:underline"
                    >
                      Ward: 0472/08.08.86
                    </a>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-400 p-2 rounded mt-2">
                    <p className="text-xs font-semibold text-green-800">
                      Warme snacks en dranken verkrijgbaar!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Links */}
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <ExternalLink className="mr-2" size={20} />
                  Inschrijven
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2 text-sm">
                  <a
                    href="https://forms.gle/7EDaG679rabcmqmD7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mainAccent hover:underline block flex items-center gap-1"
                  >
                    Google Formulier <ExternalLink size={14} />
                  </a>
                  <a
                    href="https://www.kskcolle.be"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mainAccent hover:underline block flex items-center gap-1"
                  >
                    www.kskcolle.be <ExternalLink size={14} />
                  </a>
                  <a
                    href="https://ksr.chesspaint.be"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mainAccent hover:underline block flex items-center gap-1"
                  >
                    ksr.chesspaint.be <ExternalLink size={14} />
                  </a>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative my-auto">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10"
              >
                <X size={32} />
              </button>
              <Image
                src={selectedImage}
                alt="Vergrote weergave"
                width={467}
                height={690}
                className="max-w-full max-h-screen object-contain rounded-lg"
                quality={95}
                priority
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
