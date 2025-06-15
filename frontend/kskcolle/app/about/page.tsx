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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        <History />
        <Activities />
        <Interviews />
        <PresidentsTimeline />
        <Team />
        <ClubInfo />
      </main>
    </div>
  )
}
