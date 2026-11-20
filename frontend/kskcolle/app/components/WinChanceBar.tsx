/**
 * Winstkans van een nog te spelen partij volgens de ELIO van beide spelers: een dunne
 * balk in schaakkleuren (wit links, zwart rechts), zonder percentages. De percentages
 * staan in het detailvenster van de partij.
 */
export default function WinChanceBar({ white, className = "" }: { white: number; className?: string }) {
  const w = Math.round(white * 100)
  return (
    <div
      className={`flex h-1.5 overflow-hidden rounded-full bg-gray-800 ring-1 ring-neutral-300 ${className}`}
      role="img"
      aria-label={`Winstkans volgens de ELIO: wit ${w}%, zwart ${100 - w}%`}
    >
      <div className="h-full bg-white" style={{ width: `${w}%` }} />
    </div>
  )
}
