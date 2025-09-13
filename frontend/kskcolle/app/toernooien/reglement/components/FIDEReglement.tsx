export default function FIDEReglement() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">FIDE Reglement 2025</h2>
        <div className="space-y-4 text-gray-700">
          <p>
            Het officiële FIDE reglement voor schaken zoals vastgesteld door de Wereldschaakbond FIDE. 
            Dit reglement is van toepassing op alle schaakwedstrijden en toernooien wereldwijd.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              📄 Officieel FIDE Reglement 2025
            </h3>
            <p className="text-blue-800 mb-4">
              Bekijk het volledige FIDE reglement 2025 direct in de PDF viewer hieronder.
            </p>
            
            <div className="flex items-center gap-3">
              <a
                href="/pdf/FIDE_Reglement_2025.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </a>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
              <h3 className="text-sm font-medium text-gray-700">FIDE Reglement 2025</h3>
            </div>
            <div className="relative" style={{ height: '800px' }}>
              <iframe
                src="/pdf/FIDE_Reglement_2025.pdf"
                className="w-full h-full border-0"
                title="FIDE Reglement 2025"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Belangrijke FIDE Regels</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">🏁 Eindspel Regels</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>50-zetten regel:</strong> Een partij is remise als er 50 zetten zijn gedaan zonder pionzet of slaan</li>
              <li>• <strong>Dreifachwiederholung:</strong> Dezelfde stelling moet drie keer voorkomen</li>
              <li>• <strong>Perpetuum mobile:</strong> Oneindige herhaling van zetten is niet toegestaan</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">⏰ Tijdcontrole</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Klassiek:</strong> 90 minuten + 30 seconden per zet</li>
              <li>• <strong>Rapid:</strong> 10 minuten + 5 seconden per zet</li>
              <li>• <strong>Blitz:</strong> 3 minuten + 2 seconden per zet</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">📝 Notatie</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Algebraïsche notatie:</strong> Standaard voor alle partijen</li>
              <li>• <strong>Verplicht noteren:</strong> Bij klassiek schaken</li>
              <li>• <strong>Vrijwillig:</strong> Bij rapid en blitz</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">🚫 Verboden Gedrag</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Hulp van buitenaf:</strong> Geen advies tijdens partij</li>
              <li>• <strong>Elektronica:</strong> Geen telefoons of computers</li>
              <li>• <strong>Onderbrekingen:</strong> Minimale verstoring van tegenstander</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Aanhangsels</h2>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">📋 Belangrijke Aanhangsels</h3>
          <ul className="space-y-3 text-gray-700">
            <li>
              <strong>Aanhangsels A & B:</strong> Regels voor rapid en blitz schaken
            </li>
            <li>
              <strong>Aanhangsels C:</strong> Notatie van partijen
            </li>
            <li>
              <strong>Aanhangsels D:</strong> Regels voor snelschaak
            </li>
            <li>
              <strong>Aanhangsels E:</strong> Regels voor correspondentieschaak
            </li>
            <li>
              <strong>Aanhangsels F:</strong> Regels voor blinde en slechtziende spelers
            </li>
          </ul>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Let op:</strong> Voor specifieke toernooiregels en uitzonderingen, 
              raadpleeg altijd het volledige FIDE reglement of de lokale toernooireglementen.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
