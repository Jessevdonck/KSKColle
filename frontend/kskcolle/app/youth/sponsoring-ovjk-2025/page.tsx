"use client"

import { Trophy, Mail, Phone, ExternalLink, Calendar, Gift, Megaphone, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export default function SponsoringOVJK2025Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <Trophy className="text-mainAccent" size={24} />
              <h1 className="text-xl sm:text-2xl font-bold text-textColor">
                Oost-Vlaams Jeugdkampioenschap 2026 & Rapidtoernooi Volwassenen
              </h1>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Calendar size={16} />
              <span>24 & 25 oktober 2026</span>
              <span>•</span>
              <span>OLVP Sint-Niklaas</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mb-4">
            <Card className="overflow-hidden shadow-md">
              <CardContent className="p-0">
                <div className="aspect-[4/3] relative">
                  <Image
                    src="/images/sponsoring/Sponsoring1.jpg"
                    alt="Oost-Vlaams Jeugdkampioenschap Schaken 2025"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
                      <h2 className="text-lg font-bold text-textColor mb-1">Meer dan 100 jonge schakers</h2>
                      <p className="text-gray-600 text-sm">Wachtend op hun kans om te schitteren</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sponsoring Section */}
          <Card className="mb-3 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="text-mainAccent" size={20} />
                <h2 className="text-lg font-bold text-textColor">Sponsoring</h2>
              </div>

              <div className="text-sm text-gray-700 space-y-3">
                <p>
                  Schaakclub <strong>KSK Colle Sint-Niklaas</strong> en schaakclub <strong>LSV-Chesspirant</strong>
                  organiseren op zaterdag 24 en zondag 25 oktober na een geslaagde samenwerking in 2023 en 2025
                  opnieuw het Oost-Vlaams Jeugdkampioenschap en een rapidtoernooi voor volwassenen in het
                  OLVP te Sint-Niklaas.
                </p>

                <p className="font-semibold text-mainAccent">
                  Om de meer dan 100 jonge schakers goed te kunnen omringen en voorzien van prijzen en
                  catering zijn we op zoek naar sponsoring.
                </p>

                {/* Middle Image */}
                <div className="mt-3">
                  <Card className="overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                      <div className="aspect-video relative">
                        <Image
                          src="/images/sponsoring/Sponsoring2.png"
                          alt="Jonge schaker ontvangt trofee"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to expect as sponsor */}
          <Card className="mb-3 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="text-mainAccent" size={20} />
                <h2 className="text-lg font-bold text-textColor">Wat kan u verwachten als sponsor?</h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 bg-mainAccent rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-sm">
                    <strong>Projectie op groot scherm</strong> tijdens het tweedaagse evenement en prijsuitreiking
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 bg-mainAccent rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-sm">
                    <strong>Publiciteit in communicatie</strong> over het toernooi via flyers, websites en sociale media
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 bg-mainAccent rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-sm">
                    <strong>Mogelijkheid tot het uitdelen van flyers</strong> tijdens het evenement
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sponsoring Options */}
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            {/* Financial Sponsoring */}
            <Card className="shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="text-mainAccent" size={18} />
                  <h3 className="text-base font-bold text-textColor">Financiële sponsoring</h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Storting op:</p>
                  <p className="font-mono text-base font-bold text-mainAccent">BE28 1043 2441 3820</p>
                  <p className="text-sm text-gray-600 mt-1.5">
                    Met vermelding: <strong>"Sponsoring OVJK 2026"</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* In-kind Sponsoring */}
            <Card className="shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="text-mainAccent" size={18} />
                  <h3 className="text-base font-bold text-textColor">Naturaprijzen & gadgets</h3>
                </div>

                <p className="text-gray-700 text-sm">
                  In de vorm van naturaprijzen, gadgets of waardebonnen die uitgedeeld en
                  verloot worden aan de deelnemers.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card className="mb-3 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="text-mainAccent" size={20} />
                <h2 className="text-lg font-bold text-textColor">Contact</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Mail className="text-mainAccent" size={16} />
                    <a
                      href="mailto:OVJK2025schaken@gmail.com"
                      className="text-mainAccent hover:text-mainAccentDark transition-colors font-medium text-sm"
                    >
                      ovjk.schaken.plezant@gmail.com
                    </a>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Phone className="text-mainAccent" size={16} />
                    <a
                      href="tel:0478698760"
                      className="text-mainAccent hover:text-mainAccentDark transition-colors font-medium text-sm"
                    >
                      0478/69 87 60 (Niels)
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="text-mainAccent" size={16} />
                    <a
                      href="https://www.kskcolle.be"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mainAccent hover:text-mainAccentDark transition-colors font-medium text-sm"
                    >
                      KSK Colle Sint-Niklaas
                    </a>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="text-mainAccent" size={16} />
                    <a
                      href="https://www.lsv-chesspirant.be"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mainAccent hover:text-mainAccentDark transition-colors font-medium text-sm"
                    >
                      LSV-Chesspirant
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organizer Logos */}
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="text-center mb-3">
                <h2 className="text-base font-bold text-textColor">Georganiseerd door</h2>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
                {/* Chess Board Logo */}
                <div className="w-14 h-14 relative">
                  <Image
                    src="/images/sponsoring/KSKColle.png"
                    alt="Schaakbord logo"
                    fill
                    className="object-contain"
                  />
                </div>

                {/* KSK Colle Logo */}
                <div className="w-14 h-14 relative">
                  <Image
                    src="/images/sponsoring/OostVlLiga.png"
                    alt="KSK Colle logo"
                    fill
                    className="object-contain"
                  />
                </div>

                {/* LSV-Chesspirant Logo */}
                <div className="w-14 h-14 relative">
                  <Image
                    src="/images/sponsoring/LSVChesspirant.png"
                    alt="LSV-Chesspirant logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
