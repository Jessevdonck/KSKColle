import { Info, Calendar } from "lucide-react"

const Header = () => {
  return (
    <div className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="text-center">
          <div className="bg-mainAccent/10 p-2 rounded-lg inline-flex mb-2">
            <Info className="h-6 w-6 text-mainAccent" />
          </div>
          <h1 className="text-2xl font-bold text-textColor mb-1.5">Over KSK Colle</h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Ontdek hier wie we zijn en wat we doen!
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-600">
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
