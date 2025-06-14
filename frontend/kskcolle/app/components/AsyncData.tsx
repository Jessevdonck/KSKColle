import type React from "react"

interface AsyncDataProps {
  loading: boolean
  error
  children: React.ReactNode
}

export default function AsyncData({ loading, error, children }: AsyncDataProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-500 text-4xl mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-red-700 mb-1">Er is een fout opgetreden</h3>
        <p className="text-red-600">Probeer de pagina opnieuw te laden.</p>
      </div>
    )
  }

  return <>{children}</>
}
