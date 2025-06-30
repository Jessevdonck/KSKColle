import { Info, Calendar } from "lucide-react"

const Header = () => {
  return (
    <div className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="bg-mainAccent/10 p-3 rounded-lg inline-flex mb-4">
            <Info className="h-8 w-8 text-mainAccent" />
          </div>
          <h1 className="text-3xl font-bold text-textColor mb-3">Over KSK Colle</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ontdek de rijke geschiedenis en passie van onze schaakclub, van Edgard Colle tot vandaag
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Opgericht in 1944</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
