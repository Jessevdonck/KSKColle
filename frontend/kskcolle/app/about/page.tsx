import Image from "next/image"
import { Trophy, Users, SunIcon, MapPin } from "lucide-react"

export default function AboutUs() {
  return (  
    <div className="bg-[#FAF7F0] min-h-screen">
      <header className="bg-[#B17457] text-[#FAF7F0] py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Over KSK Colle</h1>
          <p className="text-xl">Ontdek de  geschiedenis en passie van onze schaakclub</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
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
              <p className="mb-4">
                Van bescheiden beginnen zijn we uitgegroeid tot een van de meest gerespecteerde clubs in de regio, 
                met een sterke focus op jeugdontwikkeling en gemeenschapsbetrokkenheid.
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

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#4A4947] mb-6">Onze Activiteiten</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: <Trophy className="w-12 h-12 text-[#B17457]" />, title: "Competities", description: "We organiseren het hele jaar door competities tussen clubleden!" },
              { icon: <Users className="w-12 h-12 text-[#B17457]" />, title: "Jeugdwerking", description: "Elke donderdag van 18:30 tot 19:45 worden er schaaklessen gegeven door ervaren schakers!" },
              { icon: <SunIcon className="w-12 h-12 text-[#B17457]" />, title: "Zomerkampen", description: "Tijdens de zomer van 2024 organiseert Schaakclub KSK Colle samen met de stad Sint-Niklaas een zomerkamp schaken." },
              { icon: <MapPin className="w-12 h-12 text-[#B17457]" />, title: "Gemeenschap", description: "We zijn trots op onze rol in de lokale gemeenschap." },
            ].map((value, index) => (
              <div key={index} className="flex flex-col items-center text-center w-64 p-4 bg-white rounded-lg shadow-md">
                {value.icon}
                <h3 className="text-xl font-semibold text-[#4A4947] mt-4 mb-2">{value.title}</h3>
                <p className="text-[#4A4947]">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#4A4947] mb-6">Ons Team</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { name: "Niels Ongena", role: "Voorzitter", image: "/images/image_placeholder.png" },
              { name: "Patrick Gillis", role: "Secretaris", image: "/images/image_placeholder.png" },
              { name: "Maarten Covents", role: "Penningmeester", image: "/images/image_placeholder.png" },
              { name: "Ronny Eelen", role: "Verantwoordelijke jeugdwerking", image: "/images/image_placeholder.png" },
              { name: "Thomas Buys-Devillé", role: "Materiaalmeester", image: "/images/image_placeholder.png" },
            ].map((member, index) => (
              <div key={index} className="flex flex-col items-center w-48 p-4 bg-white shadow-md">
                <Image
                  src={member.image}
                  alt={`Foto van ${member.name}`}
                  width={150}
                  height={150}
                  className="rounded-sm mb-4"
                />
                <h3 className="text-xl font-semibold text-[#4A4947] text-center">{member.name}</h3>
                <p className="text-[#B17457] text-center">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}