"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Trophy, Euro, Users, Mail, Phone, ExternalLink, X } from "lucide-react"
import Image from "next/image"
import OVJKParticipants from "../info/components/OVJKParticipants"

export default function InfoOVJK2025Page() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const sponsors = [
    { src: "/images/sponsoring/Sponsor6.png", alt: "Sponsor 6" },
    { src: "/images/sponsoring/Sponsor1.png", alt: "Sponsor 1" },
    { src: "/images/sponsoring/Sponsor2.png", alt: "Sponsor 2" },
    { src: "/images/sponsoring/Sponsor3.png", alt: "Sponsor 3" },
    { src: "/images/sponsoring/Sponsor4.png", alt: "Sponsor 4" },
    { src: "/images/sponsoring/Sponsor5.jpg", alt: "Sponsor 5" },
    { src: "/images/sponsoring/Sponsor7.jpg", alt: "Sponsor 7" },
    { src: "/images/sponsoring/Sponsor8.png", alt: "Sponsor 8" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Oost-Vlaams Jeugdkampioenschap</h1>
          <div className="bg-mainAccent/10 border border-mainAccent/20 rounded-lg p-4">
            <p className="text-lg font-semibold text-mainAccent">
              SELECTIETORNOOI VOOR HET VLAAMS KAMPIOENSCHAP 2026
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Date and Location */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Calendar className="mr-2" size={24} />
                  Datum & Locatie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="mr-3 text-mainAccent" size={20} />
                    <div>
                      <p className="font-semibold text-lg">Zaterdag 25 en zondag 26 oktober 2025</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="mr-3 text-mainAccent mt-1" size={20} />
                    <div>
                      <p className="font-semibold">Campus Onze-Lieve-Vrouw-Presentatie Sint-Niklaas</p>
                      <p className="text-gray-600">Spoorweglaan 100, 9100 Sint-Niklaas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Format */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Clock className="mr-2" size={24} />
                  Formule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <p className="font-semibold text-blue-800 mb-2">A-B-C-D - Reeksen:</p>
                    <p className="text-blue-700">7 partijen 50'+10" per zet (2 dagen - 25/10 & 26/10)</p>
                  </div>
                  
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                    <p className="font-semibold text-green-800 mb-2">E-F - Reeksen:</p>
                    <p className="text-green-700">9 ronden van 20' per partij (1 dag - 26/10)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Users className="mr-2" size={24} />
                  Reeksen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold">A-reeks:</span>
                      <Badge variant="outline">junioren (°2006,2007, 2008 en 2009)</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold">B-reeks:</span>
                      <Badge variant="outline">scholieren (°2010 of 2011)</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold">C-reeks:</span>
                      <Badge variant="outline">kadetten (°2012 of 2013)</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold">D-Reeks:</span>
                      <Badge variant="outline">miniemen (°2014 of 2015)</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold">E-Reeks:</span>
                      <Badge variant="outline">pionnen (°2016 of 2017)</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="font-semibold">F-reeks:</span>
                      <Badge variant="outline">pupillen (°2018 of later)</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Program */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Clock className="mr-2" size={24} />
                  Programma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* A, B, C & D Reeksen Schema */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">A, B, C & D Reeksen</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-mainAccent/10">
                            <th className="border border-gray-300 p-3 text-left font-semibold">Dag</th>
                            <th className="border border-gray-300 p-3 text-left font-semibold">Tijd</th>
                            <th className="border border-gray-300 p-3 text-left font-semibold">Activiteit</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 p-3 font-semibold" rowSpan={5}>25/10</td>
                            <td className="border border-gray-300 p-3">10:00</td>
                            <td className="border border-gray-300 p-3">AANMELDEN TOT</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">10:10</td>
                            <td className="border border-gray-300 p-3">RONDE 1</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">12:45</td>
                            <td className="border border-gray-300 p-3">RONDE 2</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">15:00</td>
                            <td className="border border-gray-300 p-3">RONDE 3</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">17:15</td>
                            <td className="border border-gray-300 p-3">RONDE 4</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3 font-semibold" rowSpan={4}>26/10</td>
                            <td className="border border-gray-300 p-3">11:00</td>
                            <td className="border border-gray-300 p-3">RONDE 5</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">13:40</td>
                            <td className="border border-gray-300 p-3">RONDE 6</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">16:00</td>
                            <td className="border border-gray-300 p-3">RONDE 7</td>
                          </tr>
                          <tr className="bg-yellow-50">
                            <td className="border border-gray-300 p-3 font-semibold">18:30</td>
                            <td className="border border-gray-300 p-3 font-semibold">PRIJSUITREIKING</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* E & F Reeksen Schema */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">E & F Reeksen</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-mainAccent/10">
                            <th className="border border-gray-300 p-3 text-left font-semibold">Dag</th>
                            <th className="border border-gray-300 p-3 text-left font-semibold">Tijd</th>
                            <th className="border border-gray-300 p-3 text-left font-semibold">Activiteit</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 p-3 font-semibold" rowSpan={11}>26/10</td>
                            <td className="border border-gray-300 p-3">10:00</td>
                            <td className="border border-gray-300 p-3">AANMELDEN TOT</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">10:10</td>
                            <td className="border border-gray-300 p-3">RONDE 1</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">11:00</td>
                            <td className="border border-gray-300 p-3">RONDE 2</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">11:50</td>
                            <td className="border border-gray-300 p-3">RONDE 3</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">12:40</td>
                            <td className="border border-gray-300 p-3">RONDE 4</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">14:00</td>
                            <td className="border border-gray-300 p-3">RONDE 5</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">14:50</td>
                            <td className="border border-gray-300 p-3">RONDE 6</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">15:40</td>
                            <td className="border border-gray-300 p-3">RONDE 7</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">16:30</td>
                            <td className="border border-gray-300 p-3">RONDE 8</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3">17:20</td>
                            <td className="border border-gray-300 p-3">RONDE 9</td>
                          </tr>
                          <tr className="bg-yellow-50">
                            <td className="border border-gray-300 p-3 font-semibold">18:30</td>
                            <td className="border border-gray-300 p-3 font-semibold">PRIJSUITREIKING</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            
            {/* Registration Fee */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Euro className="mr-2" size={24} />
                  Inschrijvingsgeld
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-semibold">A, B, C & D reeksen:</span>
                    <span className="text-lg font-bold text-blue-800">€ 12</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="font-semibold">E & F reeksen:</span>
                    <span className="text-lg font-bold text-green-800">€ 10</span>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Te betalen bij aanmelding
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Registration Info */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Users className="mr-2" size={24} />
                  Inschrijving
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Inschrijven via:</p>
                    <a 
                      href="https://www.schaakligaoostvlaanderen.be" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-mainAccent hover:underline block"
                    >
                      www.schaakligaoostvlaanderen.be
                    </a>
                    <a 
                      href="https://www.kskcolle.be" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-mainAccent hover:underline block"
                    >
                      www.kskcolle.be → "OVJK"
                    </a>
                  </div>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <p className="text-sm font-semibold text-yellow-800">
                      Inschrijving ten laatste de dag voor de start van de 1e ronde om 20:00
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <Mail className="mr-2" size={24} />
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

            {/* Mobility */}
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

        {/* Prizes Section */}
        <div className="mt-12">
          <Card className="border-mainAccent/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-mainAccent">
                <Trophy className="mr-2" size={24} />
                Prijzen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">A-reeks:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>1e plaats:</span><span className="font-bold">€130</span></div>
                      <div className="flex justify-between"><span>2e plaats:</span><span className="font-bold">€100</span></div>
                      <div className="flex justify-between"><span>3e plaats:</span><span className="font-bold">€80</span></div>
                      <div className="flex justify-between"><span>4e plaats:</span><span className="font-bold">€50</span></div>
                      <div className="flex justify-between"><span>5e plaats:</span><span className="font-bold">€25</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">B-reeks:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>1e plaats:</span><span className="font-bold">€100</span></div>
                      <div className="flex justify-between"><span>2e plaats:</span><span className="font-bold">€80</span></div>
                      <div className="flex justify-between"><span>3e plaats:</span><span className="font-bold">€50</span></div>
                      <div className="flex justify-between"><span>4e plaats:</span><span className="font-bold">€40</span></div>
                      <div className="flex justify-between"><span>5e plaats:</span><span className="font-bold">€25</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">C-reeks:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>1e plaats:</span><span className="font-bold">€60</span></div>
                      <div className="flex justify-between"><span>2e plaats:</span><span className="font-bold">€45</span></div>
                      <div className="flex justify-between"><span>3e plaats:</span><span className="font-bold">€30</span></div>
                      <div className="flex justify-between"><span>4e plaats:</span><span className="font-bold">€20</span></div>
                      <div className="flex justify-between"><span>5e plaats:</span><span className="font-bold">€15</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">D-reeks:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>1e plaats:</span><span className="font-bold">€60</span></div>
                      <div className="flex justify-between"><span>2e plaats:</span><span className="font-bold">€45</span></div>
                      <div className="flex justify-between"><span>3e plaats:</span><span className="font-bold">€30</span></div>
                      <div className="flex justify-between"><span>4e plaats:</span><span className="font-bold">€20</span></div>
                      <div className="flex justify-between"><span>5e plaats:</span><span className="font-bold">€15</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">E-reeks:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>1e plaats:</span><span className="font-bold">€50</span></div>
                      <div className="flex justify-between"><span>2e plaats:</span><span className="font-bold">€40</span></div>
                      <div className="flex justify-between"><span>3e plaats:</span><span className="font-bold">€25</span></div>
                      <div className="flex justify-between"><span>4e plaats:</span><span className="font-bold">€20</span></div>
                      <div className="flex justify-between"><span>5e plaats:</span><span className="font-bold">€15</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">F-reeks:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>1e plaats:</span><span className="font-bold">€50</span></div>
                      <div className="flex justify-between"><span>2e plaats:</span><span className="font-bold">€40</span></div>
                      <div className="flex justify-between"><span>3e plaats:</span><span className="font-bold">€25</span></div>
                      <div className="flex justify-between"><span>4e plaats:</span><span className="font-bold">€20</span></div>
                      <div className="flex justify-between"><span>5e plaats:</span><span className="font-bold">€15</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="font-semibold text-yellow-800 mb-2">Geldprijzen gegarandeerd bij 100 deelnemers over alle reeksen heen.</p>
                  <p className="text-yellow-700 text-sm">Naturaprijs voor elke deelnemer. Bekers voor de 14 kampioenen.</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="font-semibold text-blue-800">
                    De kampioen, kampioene en de zes volgende winnen een selectie voor het Vlaams Jeugdkampioenschap van 2026
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Participants List */}
        <div className="mt-12">
          <OVJKParticipants />
        </div>

        {/* Google Form */}
        <div className="mt-12">
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
                  title="OVJK 2025 Inschrijvingsformulier"
                  onError={() => {
                    console.log('Google Form failed to load');
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <p className="text-gray-600 mb-4">
                      Het inschrijvingsformulier kon niet worden geladen.
                    </p>
                    <a 
                      href="https://docs.google.com/forms/d/e/1FAIpQLSfHNMbtDWrDwVnKP0hcHAFCIcmBWgXlByvLOX6hp2ghNzX9kQ/viewform" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-mainAccent hover:bg-mainAccentDark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Open formulier in nieuw venster
                    </a>
                  </div>
                </iframe>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Als het formulier hierboven niet werkt, gebruik dan deze link:
                </p>
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfHNMbtDWrDwVnKP0hcHAFCIcmBWgXlByvLOX6hp2ghNzX9kQ/viewform" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-mainAccent hover:underline font-medium"
                >
                  https://docs.google.com/forms/d/e/1FAIpQLSfHNMbtDWrDwVnKP0hcHAFCIcmBWgXlByvLOX6hp2ghNzX9kQ/viewform
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sponsors */}
        <div className="mt-12">
          <Card className="border-mainAccent/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-mainAccent">
                <Trophy className="mr-2" size={24} />
                Onze Sponsors
              </CardTitle>
            </CardHeader>
            <CardContent className="py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 items-center justify-items-center">
                {sponsors.map((sponsor, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage(sponsor.src)}
                  >
                    <Image
                      src={sponsor.src}
                      alt={sponsor.alt}
                      width={120}
                      height={80}
                      className="object-contain max-h-20"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X size={32} />
              </button>
              <Image
                src={selectedImage}
                alt="Sponsor in full size"
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
