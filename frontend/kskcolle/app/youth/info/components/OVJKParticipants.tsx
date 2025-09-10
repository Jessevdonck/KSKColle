"use client"

import { Trophy, ExternalLink } from "lucide-react"

export default function OVJKParticipants() {
  return (
    <section>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            OVJK Deelnemerslijst
          </h2>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-700">
              Actuele deelnemerslijst van het Oost-Vlaams Jeugdkampioenschap
            </p>
          </div>

          {/* Google Sheets iframe */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <iframe
              src="https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCTV-yg58WBsoy_Xk6sRWsHhLNICzAu46d8Bu8tmO7R_xoJKYMVHUksFNJaY_EvzB-E8mmAJpzRZ8/pubhtml?gid=1452248494&single=true"
              width="100%"
              height={600}
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              className="rounded-lg"
              title="OVJK 2025 Deelnemerslijst"
              onError={() => {
                console.log('Google Sheets iframe failed to load');
              }}
            >
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <p className="text-gray-600 mb-4">
                  De deelnemerslijst kon niet worden geladen.
                </p>
                <a 
                  href="https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCTV-yg58WBsoy_Xk6sRWsHhLNICzAu46d8Bu8tmO7R_xoJKYMVHUksFNJaY_EvzB-E8mmAJpzRZ8/pubhtml?gid=1452248494&single=true" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-mainAccent hover:bg-mainAccentDark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Open deelnemerslijst in nieuw venster
                </a>
              </div>
            </iframe>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Als de lijst hierboven niet werkt, gebruik dan deze link:
            </p>
            <a 
              href="https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCTV-yg58WBsoy_Xk6sRWsHhLNICzAu46d8Bu8tmO7R_xoJKYMVHUksFNJaY_EvzB-E8mmAJpzRZ8/pubhtml?gid=1452248494&single=true" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-mainAccent hover:underline font-medium"
            >
              https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCTV-yg58WBsoy_Xk6sRWsHhLNICzAu46d8Bu8tmO7R_xoJKYMVHUksFNJaY_EvzB-E8mmAJpzRZ8/pubhtml?gid=1452248494&single=true
            </a>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-800 text-sm mb-1">
                  Officiële deelnemerslijst
                </h4>
                <p className="text-blue-700 text-sm mb-2">
                  Deze lijst wordt automatisch bijgewerkt vanuit de officiële Google Sheets.
                </p>
                <a
                  href="https://docs.google.com/spreadsheets/d/e/2PACX-1vSLCTV-yg58WBsoy_Xk6sRWsHhLNICzAu46d8Bu8tmO7R_xoJKYMVHUksFNJaY_EvzB-E8mmAJpzRZ8/pubhtml?gid=1452248494&single=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Bekijk in Google Sheets
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
