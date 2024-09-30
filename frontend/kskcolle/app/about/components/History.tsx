import React from 'react'
import Image from 'next/image'

const History = () => {
  return ( 
    <section className="mb-16">
      <h2 className="text-3xl font-bold text-[#4A4947] mb-6">Onze Geschiedenis</h2>
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-[#4A4947]">
          <p className="mb-4">
            Edgard Colle werd op 18 mei 1897 geboren in Gent. Zijn naam is blijven voortleven in diverse clubnamen en in openingsboeken, maar wat weet u verder nog van deze man?
          </p>
          <p className="mb-4">
            Hij overleed reeds op 35-jarige leeftijd na een langdurige ziekte, en alhoewel hij van opleiding journalist was, heeft hij weinig gepubliceerd, enkele schaakrubrieken niet te na gesproken.

            Hij begon vrij jong te schaken en werd al snel lid van de Gentse schaakkring. Zoiets kan vandaag vrij normaal lijken, maar in die dagen lag dat enigszins anders.

            Schaakkringen werden enkel door deftige oudere heren bezocht. Colle maakte snel vorderingen, zij het op zijn eigen manier. Enkel het boek van Steinitz stond in zijn boekenkast.

            De rest leerde hij op de harde manier, door ondervinding. Op zijn twintigste was hij kampioen van Gent, en op zijn vijfentwintig (1922) kampioen van België.
          </p>
          <p className="mb-4">
            Een jaar later volgt de internationale doorbraak: derde in het toernooi van Scheveningen met een score van 6/9 en na Euwe en Maroczy.

            In 1924 terug kampioen van België (een titel die hij zou behouden tot en met 1929) en derde in het pre-Olympisch toernooi van Parijs.

            In 1926 boekte hij zijn grootste internationaal succes met een eerste plaats in het toernooi van Merano. 
          </p>
          <p className="mb-4">
            Niets scheen toen zijn opgang naar de absolute wereldtop in de weg te staan.

            Tot de ziekte onverbiddelijk toesloeg. Colle zou zijn optimisme bewaren, maar zijn resultaten werden onregelmatig, meer en meer afhankelijk van zijn gezondheid.

            Drie keer doorstond hij een moeilijke operatie, maar de vierde werd hem fataal. Men kan slechts dromen van wat er zou gebeurd zijn indien Colle langer had geleefd.

            Misschien was dan ook in België die schaakrage ontstaan die Nederland gekend heeft na Euwe. Het is duidelijk tot waar die rage Nederland uiteindelijk gebracht heeft in het internationale schaakwezen.
          </p>
        </div>
        <div className="flex flex-1 justify-center">
          <Image
            src="/images/colle.jpg"
            alt="Historische foto van KSK Colle"
            width={300}
            height={200}
            className="rounded-lg shadow-md"
          />
        </div>
      </div>
    </section>


  )
}

export default History