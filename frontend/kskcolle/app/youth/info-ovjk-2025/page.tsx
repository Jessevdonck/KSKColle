"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Trophy, Euro, Users, Mail, Phone, ExternalLink, X } from "lucide-react"
import Image from "next/image"
import OVJKParticipants from "../info/components/OVJKParticipants"

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfHNMbtDWrDwVnKP0hcHAFCIcmBWgXlByvLOX6hp2ghNzX9kQ/viewform"

export default function InfoOVJK2025Page() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  // Browsers don't render <iframe> children as a visible fallback (unlike <img>/<object>),
  // so we track load-failure in state and render the fallback as a sibling instead - keeping
  // the iframe childless avoids a React hydration mismatch.
  const [formFailed, setFormFailed] = useState(false)

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

  const flyers = [
    { src: "/images/Ovjk/flyer-ovjk-2026.png", alt: "Flyer Oost-Vlaams Jeugdkampioenschap 2026" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-textColor mb-2">Oost-Vlaams Jeugdkampioenschap</h1>
          <div className="bg-mainAccent/10 border border-mainAccent/20 rounded-lg p-3">
            <p className="text-sm font-semibold text-mainAccent">
              SELECTIETORNOOI VOOR HET VLAAMS KAMPIOENSCHAP 2027
            </p>
          </div>
        </div>

        {/* Flyers */}
        <div className="mb-5">
          <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
            {flyers.map((flyer) => (
              <button
                key={flyer.src}
                type="button"
                onClick={() => setSelectedImage(flyer.src)}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <Image
                  src={flyer.src}
                  alt={flyer.alt}
                  width={467}
                  height={690}
                  className="h-auto w-full object-contain"
                  priority
                />
              </button>
            ))}
          </div>
        </div>

        {/* Results Links */}
        <div className="mb-5">
          <Card className="border-mainAccent/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-mainAccent text-lg">
                <Trophy className="mr-2" size={20} />
                Uitslagen
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <a
                  href="https://frbe-kbsb.be/sites/manager/Swar/SwarResults/410/251025-00019704-%7B79d92300-748c-496d-92c8-2ae7fccc048c%7D.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded hover:from-blue-100 hover:to-blue-200 transition-all group"
                >
                  <div className="flex items-center space-x-1">
                    <Trophy className="text-blue-700" size={16} />
                    <span className="font-semibold text-sm text-gray-800">Groep A</span>
                  </div>
                  <ExternalLink className="text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                </a>
                <a 
                  href="https://frbe-kbsb.be/sites/manager/Swar/SwarResults/410/251025-0002e1bf-%7B734b1d9b-d7e6-4b6a-8662-e2ba00064aa4%7D.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded hover:from-green-100 hover:to-green-200 transition-all group"
                >
                  <div className="flex items-center space-x-1">
                    <Trophy className="text-green-700" size={16} />
                    <span className="font-semibold text-sm text-gray-800">Groep B</span>
                  </div>
                  <ExternalLink className="text-green-700 opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                </a>
                <a 
                  href="https://frbe-kbsb.be/sites/manager/Swar/SwarResults/410/251025-00035835-%7Bf45d423a-5e17-49f9-b4ef-ed2e49c585dc%7D.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded hover:from-purple-100 hover:to-purple-200 transition-all group"
                >
                  <div className="flex items-center space-x-1">
                    <Trophy className="text-purple-700" size={16} />
                    <span className="font-semibold text-sm text-gray-800">Groep C</span>
                  </div>
                  <ExternalLink className="text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                </a>
                <a 
                  href="https://frbe-kbsb.be/sites/manager/Swar/SwarResults/410/251025-000390c6-%7B57f2d65b-c71d-4ec2-87cf-f53b5dd83d01%7D.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded hover:from-orange-100 hover:to-orange-200 transition-all group"
                >
                  <div className="flex items-center space-x-1">
                    <Trophy className="text-orange-700" size={16} />
                    <span className="font-semibold text-sm text-gray-800">Groep D</span>
                  </div>
                  <ExternalLink className="text-orange-700 opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                </a>
                <a 
                  href="https://frbe-kbsb.be/sites/manager/Swar/SwarResults/410/251025-00035491-%7Bbd543f46-4663-4b77-b9e9-eda3adce9cbb%7D.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded hover:from-orange-100 hover:to-orange-200 transition-all group"
                >
                  <div className="flex items-center space-x-1">
                    <Trophy className="text-orange-700" size={16} />
                    <span className="font-semibold text-sm text-gray-800">Groep E & F</span>
                  </div>
                  <ExternalLink className="text-orange-700 opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-2">
            
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
                      <p className="font-semibold text-lg">Zaterdag 24 en zondag 25 oktober 2026</p>
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
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <Clock className="mr-2" size={20} />
                  Formule
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                    <p className="font-semibold text-blue-800 mb-2">A-B-C-D - Reeksen:</p>
                    <p className="text-blue-700">7 partijen 50'+10" per zet (2 dagen - 24/10 & 25/10)</p>
                  </div>
                  
                  <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                    <p className="font-semibold text-green-800 mb-2">E-F - Reeksen:</p>
                    <p className="text-green-700">9 ronden van 20' per partij (1 dag - 25/10)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <Users className="mr-2" size={20} />
                  Reeksen
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-semibold">A-reeks:</span>
                      <Badge variant="outline">junioren (°2007,2008, 2009 en 2010)</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-semibold">B-reeks:</span>
                      <Badge variant="outline">scholieren (°2011 of 2012)</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-semibold">C-reeks:</span>
                      <Badge variant="outline">kadetten (°2013 of 2014)</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-semibold">D-Reeks:</span>
                      <Badge variant="outline">miniemen (°2015 of 2016)</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-semibold">E-Reeks:</span>
                      <Badge variant="outline">pionnen (°2017 of 2018)</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-semibold">F-reeks:</span>
                      <Badge variant="outline">pupillen (°2019 of later)</Badge>
                    </div>
                  </div>
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
                <div className="space-y-3">
                  {/* A, B, C & D Reeksen Schema */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">A, B, C & D Reeksen</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-mainAccent/10">
                            <th className="border border-gray-300 p-2 text-left font-semibold text-sm">Dag</th>
                            <th className="border border-gray-300 p-2 text-left font-semibold text-sm">Tijd</th>
                            <th className="border border-gray-300 p-2 text-left font-semibold text-sm">Activiteit</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 p-3 font-semibold" rowSpan={5}>24/10</td>
                            <td className="border border-gray-300 p-3">10:00</td>
                            <td className="border border-gray-300 p-3">AANMELDEN TOT</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">10:10</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 1</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">12:45</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 2</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">15:00</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 3</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">17:15</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 4</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-3 font-semibold" rowSpan={4}>25/10</td>
                            <td className="border border-gray-300 p-3">11:00</td>
                            <td className="border border-gray-300 p-3">RONDE 5</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">13:40</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 6</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">16:00</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 7</td>
                          </tr>
                          <tr className="bg-orange-50">
                            <td className="border border-gray-300 p-2 text-sm font-semibold">18:30</td>
                            <td className="border border-gray-300 p-2 text-sm font-semibold">PRIJSUITREIKING</td>
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
                            <th className="border border-gray-300 p-2 text-left font-semibold text-sm">Dag</th>
                            <th className="border border-gray-300 p-2 text-left font-semibold text-sm">Tijd</th>
                            <th className="border border-gray-300 p-2 text-left font-semibold text-sm">Activiteit</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 p-3 font-semibold" rowSpan={11}>25/10</td>
                            <td className="border border-gray-300 p-3">10:00</td>
                            <td className="border border-gray-300 p-3">AANMELDEN TOT</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">10:10</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 1</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">11:00</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 2</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">11:50</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 3</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">12:40</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 4</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">14:00</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 5</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">14:50</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 6</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">15:40</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 7</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">16:30</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 8</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-2 text-sm">17:20</td>
                            <td className="border border-gray-300 p-2 text-sm">RONDE 9</td>
                          </tr>
                          <tr className="bg-orange-50">
                            <td className="border border-gray-300 p-2 text-sm font-semibold">18:30</td>
                            <td className="border border-gray-300 p-2 text-sm font-semibold">PRIJSUITREIKING</td>
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
          <div className="space-y-2">
            
            {/* Registration Fee */}
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <Euro className="mr-2" size={20} />
                  Inschrijvingsgeld
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="font-semibold">A, B, C & D reeksen:</span>
                    <span className="text-lg font-bold text-blue-800">€ 12</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
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
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <Users className="mr-2" size={20} />
                  Inschrijving
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Inschrijven via het inschrijvingsformulier onderaan deze pagina</p>

                  <div className="bg-orange-50 border-l-4 border-orange-400 p-2 rounded">
                    <p className="text-sm font-semibold text-orange-800">
                      Inschrijving ten laatste de dag voor de start van de 1e ronde om 20:00
                    </p>
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
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Mail className="mr-2 mt-1 text-mainAccent" size={16} />
                    <div>
                      <p className="text-sm text-gray-600">Email:</p>
                      <a 
                        href="mailto:ovjk.schaken.plezant@gmail.com" 
                        className="text-mainAccent hover:underline font-medium"
                      >
                        ovjk.schaken.plezant@gmail.com
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

                  <div className="bg-green-50 border-l-4 border-green-400 p-2 rounded">
                    <p className="text-sm font-semibold text-green-800">
                      Warme snacks en dranken verkrijgbaar aan democratische prijzen!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobility */}
            <Card className="border-mainAccent/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-mainAccent text-base">
                  <MapPin className="mr-2" size={20} />
                  Mobiliteit
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-gray-700">
                  De locatie is vlot bereikbaar met de fiets, auto en het openbaar vervoer 
                  en ligt op wandelafstand van het station van Sint-Niklaas.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Prizes Section */}
        <div className="mt-6">
          <Card className="border-mainAccent/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-mainAccent text-base">
                <Trophy className="mr-2" size={20} />
                Prijzen
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

                <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded">
                  <p className="font-semibold text-orange-800 mb-2">Geldprijzen gegarandeerd bij 100 deelnemers over alle reeksen heen.</p>
                  <p className="text-orange-700 text-sm">Naturaprijs voor elke deelnemer. Bekers voor de 14 kampioenen.</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <p className="font-semibold text-blue-800">
                    De kampioen, kampioene en de zes volgende winnen een selectie voor het Vlaams Jeugdkampioenschap van 2027
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Participants List */}
        <div className="mt-5">
          <OVJKParticipants />
        </div>

        {/* Google Form */}
        <div className="mt-5">
          <Card className="border-mainAccent/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-mainAccent text-base">
                <Users className="mr-2" size={20} />
                Inschrijvingsformulier
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                {formFailed ? (
                  <div className="flex flex-col items-center justify-center h-[800px] text-center p-8">
                    <p className="text-gray-600 mb-4">
                      Het inschrijvingsformulier kon niet worden geladen.
                    </p>
                    <a
                      href={GOOGLE_FORM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-mainAccent hover:bg-mainAccentDark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Open formulier in nieuw venster
                    </a>
                  </div>
                ) : (
                  <iframe
                    src={`${GOOGLE_FORM_URL}?embedded=true`}
                    width="100%"
                    height={800}
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    className="rounded-lg"
                    title="OVJK 2025 Inschrijvingsformulier"
                    onError={() => setFormFailed(true)}
                  />
                )}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Als het formulier hierboven niet werkt, gebruik dan deze link:
                </p>
                <a
                  href={GOOGLE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mainAccent hover:underline font-medium"
                >
                  {GOOGLE_FORM_URL}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sponsors */}
        <div className="mt-5">
          <Card className="border-mainAccent/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-mainAccent text-base">
                <Trophy className="mr-2" size={20} />
                Onze Sponsors
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 items-center justify-items-center">
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
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3 overflow-y-auto"
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
