import { Info, Calendar, Users } from "lucide-react"

const Header = () => {
  return (
    <div className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="bg-mainAccent/10 p-4 rounded-xl inline-flex mb-6">
            <Info className="h-12 w-12 text-mainAccent" />
          </div>
          <h1 className="text-4xl font-bold text-textColor mb-4">Over KSK Colle</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ontdek de rijke geschiedenis en passie van onze schaakclub, van Edgard Colle tot vandaag
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-600">
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
