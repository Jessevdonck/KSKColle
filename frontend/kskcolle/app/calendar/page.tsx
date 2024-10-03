import Calendar from './components/Calendar'
import { calendarEvents } from '../../data/mock_data'

export default function CalendarPage() {
  return (
    <div className="bg-[#FAF7F0] min-h-screen">
      <Calendar events={calendarEvents} />
    </div>
  )
}