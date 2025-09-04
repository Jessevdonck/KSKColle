"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Euro, Trophy, Calendar, Users, Phone, Mail } from 'lucide-react';

export default function RapidToernooiPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <Image
              src="/images/sponsoring/KSKColle.png"
              alt="KSK Colle Logo"
              width={80}
              height={80}
              className="mr-4"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Rapid Volwassenen
            </h1>
            <Image
              src="/images/sponsoring/LSVChesspirant.png"
              alt="LSV Chesspirant Logo"
              width={80}
              height={80}
              className="ml-4"
            />
          </div>
          <div className="flex items-center justify-center text-xl text-mainAccent font-semibold mb-4">
            <Calendar className="mr-2" size={24} />
            Zaterdag 25 oktober 2025
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Address Card */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <MapPin className="mr-2" size={24} />
                  Adres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Campus Onze-Lieve-Vrouw-Presentatie Sint-Niklaas</p>
                  <p className="text-gray-600">Spoorweglaan 100, 9100 Sint-Niklaas</p>
                </div>
              </CardContent>
            </Card>

            {/* Formula Card */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Clock className="mr-2" size={24} />
                  Formule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-3">7 rondes</Badge>
                    <span>Speeltempo: 10+5" per zet</span>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="font-semibold text-yellow-800">
                      Enkel voor spelers geboren voor 31 december 2005
                    </p>
                    <p className="text-yellow-700 mt-1">
                      Of die niet behoren tot de Liga Oost-Vlaanderen
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Program Card */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Calendar className="mr-2" size={24} />
                  Programma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">AANMELDEN TOT</span>
                      <span className="font-bold text-mainAccent">13:00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">RONDE 1</span>
                      <span className="font-bold">13:30</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">RONDE 2</span>
                      <span className="font-bold">14:05</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">RONDE 3</span>
                      <span className="font-bold">14:40</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">RONDE 4</span>
                      <span className="font-bold">15:15</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">RONDE 5</span>
                      <span className="font-bold">15:50</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">RONDE 6</span>
                      <span className="font-bold">16:25</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">RONDE 7</span>
                      <span className="font-bold">17:00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">PRIJSUITREIKING</span>
                      <span className="font-bold text-mainAccent">18:00</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price and Registration Info */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Euro className="mr-2" size={24} />
                  Inschrijvingskosten & Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center bg-green-50 border border-green-200 rounded-lg p-4">
                    <Euro className="mr-2 text-green-600" size={24} />
                    <span className="text-2xl font-bold text-green-800">€ 10 per speler</span>
                    <span className="ml-2 text-green-700">te betalen bij aanmelding</span>
                  </div>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <p className="font-semibold text-blue-800 mb-2">Inschrijving:</p>
                    <p className="text-blue-700 mb-2">
                      <strong>Deadline:</strong> 25 oktober om 12:00
                    </p>
                    <p className="text-sm text-blue-600">
                      Spelers die volgens het reglement niet mogen deelnemen aan het OVJK, 
                      mogen deelnemen aan het rapidtoernooi voor volwassenen.
                    </p>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="font-semibold text-yellow-800 mb-2">Alternatieve inschrijving:</p>
                    <a 
                      href="https://docs.google.com/forms/d/e/1FAIpQLSfHNMbtDWrDwVnKP0hcHAFCIcmBWgXlByvLOX6hp2ghNzX9kQ/viewform" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-yellow-600 hover:text-yellow-800 underline font-medium"
                    >
                      Open formulier in nieuw venster
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Embedded Google Form */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Users className="mr-2" size={24} />
                  Inschrijvingsformulier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <iframe
                    src="https://docs.google.com/forms/d/e/1FAIpQLSfHNMbtDWrDwVnKP0hcHAFCIcmBWgXlByvLOX6hp2ghNzX9kQ/viewform?embedded=true"
                    width="100%"
                    height={800}
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    className="rounded-lg"
                    title="Rapid Toernooi Inschrijvingsformulier"
                  >
                    Laden...
                  </iframe>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Als het formulier niet laadt, klik dan op de link hierboven om het in een nieuw venster te openen.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prizes Card */}
            <Card className="border-yellow-400/30 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-800">
                  <Trophy className="mr-2" size={24} />
                  Prijzen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-yellow-800">Beker voor de winnaar</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">1e plaats</span>
                      <span className="font-bold text-green-600">€50</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">2e plaats</span>
                      <span className="font-bold text-green-600">€40</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">3e plaats</span>
                      <span className="font-bold text-green-600">€30</span>
                    </div>
                  </div>

                  <div className="border-t border-yellow-300 pt-3">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">Ratingprijzen:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Beste -2000</span>
                        <span className="font-bold">€20</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Beste -1800</span>
                        <span className="font-bold">€20</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Beste -1600</span>
                        <span className="font-bold">€20</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-200 p-3 rounded text-center">
                    <p className="text-sm font-bold text-yellow-800">
                      Geldprijzen gegarandeerd vanaf 25 deelnemers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Phone className="mr-2" size={24} />
                  Vragen?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="mr-2 mt-1 text-mainAccent" size={16} />
                    <div>
                      <p className="text-sm text-gray-600">Email:</p>
                      <a 
                        href="mailto:ovjk2025schaken@gmail.com" 
                        className="text-mainAccent hover:underline font-medium"
                      >
                        ovjk2025schaken@gmail.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="mr-2 mt-1 text-mainAccent" size={16} />
                    <div>
                      <p className="text-sm text-gray-600">Telefoon:</p>
                      <a 
                        href="tel:0472080886" 
                        className="text-mainAccent hover:underline font-medium"
                      >
                        Ward: 0472/08.08.86
                      </a>
                    </div>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                    <p className="text-sm font-semibold text-green-800">
                      Warme snacks en dranken verkrijgbaar aan democratische prijzen!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobility Card */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <MapPin className="mr-2" size={24} />
                  Mobiliteit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  De locatie is vlot bereikbaar met de fiets, auto en het openbaar vervoer 
                  en ligt op wandelafstand van het station van Sint-Niklaas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
