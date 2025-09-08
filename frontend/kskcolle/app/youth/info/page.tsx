import YouthHeader from "./components/header"
import YouthInfo from "./components/info"
import Practical from "./components/practical"
import Teachers from "./components/teachers"

export default function JeugdPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <YouthHeader />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-6">
        <YouthInfo />
        <Practical />
        <Teachers />
      </main>
    </div>
  )
}
