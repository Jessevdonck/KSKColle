import Image from "next/image"
import { Info, BookOpen, Award, Users } from "lucide-react"

export default function YouthInfo() {
  return (
    <section>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Info className="h-5 w-5" />
            Jeugdwerking KSK Colle
          </h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Image (from provided screenshot) */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-mainAccent/10 to-mainAccentDark/10 rounded-lg p-3 border border-neutral-200">
                <Image
                  src="/images/jeugdwerking.jpg"
                  alt="Jeugdlokaal in Taverne De Graanmaat"
                  width={640}
                  height={360}
                  className="rounded-lg shadow-md w-full object-cover bg-white"
                />
              </div>
            </div>

            {/* Text */}
            <div className="lg:col-span-2 space-y-4 text-textColor">
              <p className="text-sm text-gray-700">
                De jeugdwerking van KSK Colle vindt elke dinsdag (stap 1+2) en donderdag (stap 3+) van het schooljaar (niet in schoolvakanties) plaats.
                Stap 1 en 2 gaat door op dinsdag van 17:30u tot 18:30u in de Wonderbar op de eerste verdieping van de Bib van Sint-Niklaas 
                Stappen 3 en hoger starten om 18:30u tot 19:45 in zaal 4 "De Wintertuin" van Taverne De Graanmaat op de grote markt van Sint-Niklaas.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-mainAccent/5 rounded-lg p-4 border-l-4 border-mainAccent">
                  <h3 className="text-base font-semibold text-mainAccent mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Doelgroep
                  </h3>
                  <p className="text-sm text-gray-700">Kinderen en jongeren van 6 tot en met 18 jaar.</p>
                </div>

                <div className="bg-mainAccent/5 rounded-lg p-4 border-l-4 border-mainAccent">
                  <h3 className="text-base font-semibold text-mainAccent mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Methode
                  </h3>
                  <p className="text-sm text-gray-700">
                    We werken met de Nederlandse Stappenmethode. Nieuwe schakers worden in een stap (1, 2, 3, …)
                    ingedeeld naar sterkte, met een aangepast programma en lessen op maat.
                  </p>
                  <a
                    href="https://www.stappenmethode.nl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-mainAccent underline"
                  >
                    Leren schaken met de Stappenmethode
                  </a>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-amber-800 text-sm">Wat mag je verwachten?</span>
                </div>
                <ul className="text-amber-700 space-y-1 text-sm list-disc pl-5">
                  <li>Persoonlijke begeleiding voor alle niveaus: van absolute beginner tot gevorderde.</li>
                  <li>Gastlessen door ervaren schakers uit of buiten de club.</li>
                  <li>Speelkansen: doorlopende competitie, losse toernooien en vrije schaakavonden voor jeugdleden.</li>
                </ul>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg p-4 border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100">
                  <h4 className="text-sm font-semibold text-textColor mb-1">Lidgeld</h4>
                  <p className="text-sm text-gray-700">25 euro per jaar.</p>
                </div>
                <div className="rounded-lg p-4 border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100">
                  <h4 className="text-sm font-semibold text-textColor mb-1">Instapmomenten</h4>
                  <p className="text-sm text-gray-700">
                    Nieuwe jeugdleden starten op een van de drie vaste instapmomenten:
                    bij het begin van het schooljaar, na de kerstvakantie en na de paasvakantie.
                    Zo starten nieuwkomers steeds samen en blijft de groep op hetzelfde tempo werken.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Interesse? Gebruik het contactformulier op de website of stuur een mail naar Patrick.Gillis3@telenet.be
                  </p>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
