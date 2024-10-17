import Calendar from './components/Calendar'
import { calendarEvents } from '../../data/mock_data'

export default function CalendarPage() {
  return (
    <div className="bg-neutral-50 min-h-screen">
      <Calendar events={calendarEvents} />
    </div>
  )
}