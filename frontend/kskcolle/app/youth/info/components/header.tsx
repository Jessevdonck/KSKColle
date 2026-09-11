import { GraduationCap, Calendar } from "lucide-react";

export default function YouthHeader() {
  return (
    <div className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="text-center">
          <div className="bg-mainAccent/10 p-2 rounded-lg inline-flex mb-2">
            <GraduationCap className="h-6 w-6 text-mainAccent" />
          </div>
          <h1 className="text-2xl font-bold text-textColor mb-1.5">
            Jeugdwerking
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Schaaklessen en begeleiding voor jeugd van 6 tot en met 18 jaar, op
            maat en met plezier leren schaken
          </p>
          <div className="mt-3 max-w-2xl mx-auto">
            <div className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 shadow-sm">
              <p className="text-sm text-orange-900 font-semibold">
                Inschrijven kan nu tot en met eind september 2026.
              </p>
              <p className="mt-0.5 text-xs text-orange-900">
                Inschrijven kan door een mail te sturen naar patrick.gillis3@telenet.be.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Elke dinsdag (stap 1+2) en donderdag (stap 3+)tijdens het schooljaar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
