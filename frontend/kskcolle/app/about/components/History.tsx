import Image from "next/image"
import { BookOpen, Trophy, Calendar } from "lucide-react"

const History = () => {
  return (
    <section>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Onze Geschiedenis
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Text Content */}
            <div className="lg:col-span-2 space-y-4 text-textColor">
              <div className="bg-mainAccent/5 rounded-lg p-4 border-l-4 border-mainAccent">
                <h3 className="text-base font-semibold text-mainAccent mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Edgard Colle (1897-1932)
                </h3>
                <p className="text-sm text-gray-700">
                  Edgard Colle werd op 18 mei 1897 geboren in Gent. Zijn naam is blijven voortleven in diverse clubnamen
                  en in openingsboeken, maar wat weet u verder nog van deze man?
                </p>
              </div>

              <div className="prose prose-gray max-w-none text-sm space-y-3">
                <p>
                  Hij overleed reeds op 35-jarige leeftijd na een langdurige ziekte, en alhoewel hij van opleiding
                  journalist was, heeft hij weinig gepubliceerd, enkele schaakrubrieken niet te na gesproken.
                </p>
                <p>
                  Hij begon vrij jong te schaken en werd al snel lid van de Gentse schaakkring. Zoiets kan vandaag vrij
                  normaal lijken, maar in die dagen lag dat enigszins anders. Schaakkringen werden enkel door deftige
                  oudere heren bezocht.
                </p>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200 my-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold text-amber-800 text-sm">Belangrijke prestaties</span>
                  </div>
                  <ul className="text-amber-700 space-y-1 text-xs">
                    <li>• Op zijn twintigste: kampioen van Gent</li>
                    <li>• 1922: kampioen van België (op 25-jarige leeftijd)</li>
                    <li>• 1923: derde in Scheveningen (6/9, na Euwe en Maroczy)</li>
                    <li>• 1924: opnieuw kampioen van België</li>
                    <li>• 1926: eerste plaats in het toernooi van Merano</li>
                  </ul>
                </div>
                <p>
                  Colle maakte snel vorderingen, zij het op zijn eigen manier. Enkel het boek van Steinitz stond in zijn
                  boekenkast. De rest leerde hij op de harde manier, door ondervinding.
                </p>
                <p>
                  Niets scheen toen zijn opgang naar de absolute wereldtop in de weg te staan. Tot de ziekte
                  onverbiddelijk toesloeg. Colle zou zijn optimisme bewaren, maar zijn resultaten werden onregelmatig,
                  meer en meer afhankelijk van zijn gezondheid.
                </p>
                <p className="text-gray-600 italic bg-gray-50 p-3 rounded-lg text-xs">
                  &quot;Men kan slechts dromen van wat er zou gebeurd zijn indien Colle langer had geleefd. Misschien
                  was dan ook in België die schaakrage ontstaan die Nederland gekend heeft na Euwe.&quot;
                </p>
              </div>
            </div>

            {/* Image */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-gradient-to-br from-mainAccent/10 to-mainAccentDark/10 rounded-lg p-4">
                  <Image
                    src="/images/colle.jpg"
                    alt="Historische foto van Edgard Colle"
                    width={250}
                    height={320}
                    className="rounded-lg shadow-md w-full object-cover"
                  />
                  <div className="mt-3 text-center">
                    <h4 className="font-semibold text-textColor text-sm">Edgard Colle</h4>
                    <p className="text-xs text-gray-600">1897 - 1932</p>
                    <p className="text-xs text-mainAccent mt-1">Naamgever van onze club</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default History
