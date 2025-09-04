"use client"

import { Trophy, Mail, Phone, ExternalLink, Users, Calendar, Gift, Megaphone, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function SponsoringOVJK2025Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Trophy className="text-mainAccent" size={48} />
              <h1 className="text-4xl font-bold text-textColor">
                Oost-Vlaams Jeugdkampioenschap Schaken 2025
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-4">
              & Rapidtoernooi Volwassenen
            </p>
            <div className="flex items-center justify-center space-x-2 text-lg text-gray-500">
              <Calendar size={20} />
              <span>25 & 26 oktober 2025</span>
              <span>•</span>
              <span>OLVP Sint-Niklaas</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mb-12">
            <Card className="overflow-hidden shadow-lg">
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
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
                      <h2 className="text-2xl font-bold text-textColor mb-2">Meer dan 100 jonge schakers</h2>
                      <p className="text-gray-600">Wachtend op hun kans om te schitteren</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Sponsoring Section */}
          <Card className="mb-8 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Megaphone className="text-mainAccent" size={32} />
                <h2 className="text-3xl font-bold text-textColor">SPONSORING</h2>
              </div>
              
              <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
                <p>
                  Schaakclub <strong>KSK Colle Sint-Niklaas</strong> en schaakclub <strong>LSV-Chesspirant</strong> 
                  organiseren op zaterdag 25 en zondag 26 oktober na een geslaagde samenwerking in 2023 
                  opnieuw het Oost-Vlaams Jeugdkampioenschap en een rapidtoernooi voor volwassenen in het 
                  OLVP te Sint-Niklaas.
                </p>
                
                <p className="text-lg font-semibold text-mainAccent">
                  Om de meer dan 100 jonge schakers goed te kunnen omringen en voorzien van prijzen en 
                  catering zijn we op zoek naar sponsoring.
                </p>
                
                {/* Middle Image */}
                <div className="mt-8">
                  <Card className="overflow-hidden shadow-md">
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
          <Card className="mb-8 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Gift className="text-mainAccent" size={32} />
                <h2 className="text-3xl font-bold text-textColor">Wat kan u verwachten als sponsor?</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-mainAccent rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <strong>Projectie op groot scherm</strong> tijdens het tweedaagse evenement en prijsuitreiking
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-mainAccent rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <strong>Publiciteit in communicatie</strong> over het toernooi via flyers, websites en sociale media
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-mainAccent rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-gray-700">
                    <strong>Mogelijkheid tot het uitdelen van flyers</strong> tijdens het evenement
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sponsoring Options */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Financial Sponsoring */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="text-mainAccent" size={24} />
                  <h3 className="text-xl font-bold text-textColor">Financiële sponsoring</h3>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Storting op:</p>
                  <p className="font-mono text-lg font-bold text-mainAccent">BE28 1043 2441 3820</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Met vermelding: <strong>"Sponsoring OVJK 2025"</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* In-kind Sponsoring */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Gift className="text-mainAccent" size={24} />
                  <h3 className="text-xl font-bold text-textColor">Naturaprijzen & gadgets</h3>
                </div>
                
                <p className="text-gray-700">
                  In de vorm van naturaprijzen, gadgets of waardebonnen die uitgedeeld en 
                  verloot worden aan de deelnemers.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card className="mb-8 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Mail className="text-mainAccent" size={32} />
                <h2 className="text-3xl font-bold text-textColor">Contact</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="text-mainAccent" size={20} />
                    <a 
                      href="mailto:OVJK2025schaken@gmail.com" 
                      className="text-mainAccent hover:text-mainAccentDark transition-colors font-medium"
                    >
                      OVJK2025schaken@gmail.com
                    </a>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="text-mainAccent" size={20} />
                    <a 
                      href="tel:0478698760" 
                      className="text-mainAccent hover:text-mainAccentDark transition-colors font-medium"
                    >
                      0478/69 87 60 (Niels)
                    </a>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="text-mainAccent" size={20} />
                    <a 
                      href="https://www.kskcolle.be" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-mainAccent hover:text-mainAccentDark transition-colors font-medium"
                    >
                      KSK Colle Sint-Niklaas
                    </a>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="text-mainAccent" size={20} />
                    <a 
                      href="https://www.lsv-chesspirant.be" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-mainAccent hover:text-mainAccentDark transition-colors font-medium"
                    >
                      LSV-Chesspirant
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organizer Logos */}
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-textColor mb-2">Georganiseerd door</h2>
              </div>
              
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                {/* Chess Board Logo */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-20 h-20 relative">
                    <Image
                      src="/images/sponsoring/KSKColle.png"
                      alt="Schaakbord logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                
                {/* KSK Colle Logo */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-20 h-20 relative">
                    <Image
                      src="/images/sponsoring/OostVlLiga.png"
                      alt="KSK Colle logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                
                {/* LSV-Chesspirant Logo */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-20 h-20 relative">
                    <Image
                      src="/images/sponsoring/LSVChesspirant.png"
                      alt="LSV-Chesspirant logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
