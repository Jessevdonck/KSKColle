import Header from "./components/Header"
import History from "./components/History"
import Activities from "./components/Activities"
import Team from "./components/Team"
import PresidentsTimeline from "./components/PresidentsTimeline"

export default function AboutUs() {
  return (  
    <div className="bg-[#FAF7F0] min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <History />
        <Activities />
        <Team />
        <PresidentsTimeline />
      </main>
    </div>
  )
}
