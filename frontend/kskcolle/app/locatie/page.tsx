import fs from "fs"
import path from "path"
import Image from "next/image"

export default function LocatiePage() {
  const publicDir = path.join(process.cwd(), "public", "images", "locatie")
  let fileNames: string[] = []
  try {
    fileNames = fs
      .readdirSync(publicDir)
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
      .sort()
  } catch {
    fileNames = []
  }

  const images = fileNames.map((f) => `/images/locatie/${f}`)

  const texts = [
    "Al onze wederkerende activiteiten vinden plaats in Taverne De Graanmaat op de Grote Markt van Sint-Niklaas. Adres: Grote Markt 24, 9100 Sint-Niklaas",
    "De wintertuin is onze vaste stek voor zowel onze jeugdwerking en clubavond op donderdag, de Oost-Vlaamse Interclub op vrijdag als de Nationale Interclubcompetitie op zondag.",
    "Daarnaast maken we voor nevenactiviteiten regelmatig gebruik van de andere zalen die De Graanmaat te bieden heeft.",
    "Zowel het café vooraan als alle zalen achteraan en de toiletten zijn volledig rolstoeltoegankelijk.",
  ]

  const blocks: Array<{ type: "text" | "image"; content: string }> = []
  let imgIdx = 0
  texts.forEach((t, idx) => {
    blocks.push({ type: "text", content: t })
    if (imgIdx < images.length && idx < texts.length - 1) {
      blocks.push({ type: "image", content: images[imgIdx++] })
    }
  })
  while (imgIdx < images.length) {
    blocks.push({ type: "image", content: images[imgIdx++] })
  }

  return (
    <main className="bg-neutral-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-mainAccent to-mainAccentDark text-white">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold">Onze Locatie</h1>
          <p className="text-white/90 mt-2 max-w-3xl">
            Taverne De Graanmaat op de Grote Markt van Sint-Niklaas is onze thuisbasis voor clubavonden, jeugdwerking en interclub.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-8">
        {/* Alternating sections (eerste blok: image + 2 info-kaarten) */}
        <div className="mt-8 space-y-10">
          {texts.map((text, idx) => {
            const img = images[idx] || images[idx - 1] || images[0]
            if (idx === 0) {
              return (
                <div key={idx} className="grid gap-6 md:grid-cols-2 items-stretch">
                  {/* First photo (rechts op desktop) */}
                  <div className="md:order-2 relative w-full aspect-[16/10] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                    {img && (
                      <Image
                        src={img}
                        alt="Locatie"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                        className="object-cover"
                        priority
                      />
                    )}
                  </div>
                  {/* Two stacked cards (links op desktop) */}
                  <div className="md:order-1 flex flex-col gap-6">
                    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
                      <h2 className="text-xl font-semibold text-textColor mb-3">Taverne De Graanmaat</h2>
                      <p className="text-gray-700 leading-7">
                        Al onze wederkerende activiteiten vinden plaats in Taverne De Graanmaat op de Grote Markt van Sint-Niklaas.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-mainAccent/10 text-mainAccent text-sm font-medium">
                        Adres: Grote Markt 24, 9100 Sint-Niklaas
                      </div>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
                      <h3 className="text-sm font-semibold text-textColor mb-2">Toegankelijkheid</h3>
                      <p className="text-sm text-gray-700">
                        Zowel het café vooraan als alle zalen achteraan en de toiletten zijn volledig rolstoeltoegankelijk.
                      </p>
                    </div>
                  </div>
                </div>
              )
            }

            const imageFirst = idx % 2 === 1
            return (
              <div key={idx} className="grid gap-6 md:grid-cols-2 items-center">
                {/* Image */}
                <div className={`${imageFirst ? '' : 'md:order-2'} relative w-full aspect-[16/10] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm`}>
                  {img && (
                    <Image
                      src={img}
                      alt="Locatie"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                      className="object-cover"
                    />
                  )}
                </div>
                {/* Text */}
                <div className={`${imageFirst ? 'md:order-2' : ''} bg-white border border-neutral-200 rounded-xl shadow-sm p-6`}>
                  <p className="text-gray-800 leading-7">{text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}


