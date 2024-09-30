import React from 'react'

const presidents = [
    { name: "Robert Pauwels", period: "1944 - 1969" },
    { name: "Leon Coppens", period: "1969 - 1994" },
    { name: "Marc Weyns", period: "1994 - 2001" },
    { name: "Wim Weyers", period: "2001 - 2019" },
    { name: "Bart Schittekat", period: "2019 - 2023" },
    { name: "Niels Ongena", period: "2023 - heden" },
  ]

const Presidents = () => {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold text-[#4A4947] mb-6">Onze Voorzitters</h2>
      <div className="relative border-l-4 border-[#B17457] ml-4">
        {presidents.map((president, index) => (
          <div key={index} className="mb-8 ml-6">
            <div className="absolute w-3 h-3 bg-[#B17457] rounded-full mt-1.5 -left-1.5"></div>
            <time className="mb-1 text-sm font-normal leading-none text-[#B17457]">{president.period}</time>
            <h3 className="text-lg font-semibold text-[#4A4947]">{president.name}</h3>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Presidents