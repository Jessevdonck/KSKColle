import Header from "./components/Header"
import History from "./components/History"
import Activities from "./components/Activities"
import Team from "./components/Team"
import PresidentsTimeline from "./components/PresidentsTimeline"
import Interviews from "./components/Interviews"
import ClubInfo from "./components/Clubinfo"

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Header />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-6">
        <Activities />
        <PresidentsTimeline />
        <Team />
        <Interviews />
        <ClubInfo />
        <History />
      </main>
    </div>
  )
}
