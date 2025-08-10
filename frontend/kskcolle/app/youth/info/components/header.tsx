import { GraduationCap, Calendar } from "lucide-react"

export default function YouthHeader() {
  return (
    <div className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="bg-mainAccent/10 p-3 rounded-lg inline-flex mb-4">
            <GraduationCap className="h-8 w-8 text-mainAccent" />
          </div>
          <h1 className="text-3xl font-bold text-textColor mb-3">Jeugdwerking</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Schaaklessen en begeleiding voor jeugd van 6 tot en met 18 jaar, op maat en met plezier leren schaken
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Elke donderdag tijdens het schooljaar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
