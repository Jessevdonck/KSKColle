/**
 * Winstkans van een nog te spelen partij volgens de ELIO van beide spelers, op één lijn:
 * "wit% ▬▬▬▬▭ zwart%" met een dunne balk in schaakkleuren. Staat in de paringen tussen
 * wit en zwart (op computer), op de plaats van het pijltje.
 */
export default function WinChanceBar({ white, className = "" }: { white: number; className?: string }) {
  const w = Math.round(white * 100)
  const b = 100 - w
  const label = `Winstkans volgens de ELIO: wit ${w}%, zwart ${b}%`

  return (
    <div
      className={`inline-flex items-center gap-1 text-[10px] font-semibold leading-none tabular-nums text-gray-600 ${className}`}
      title={label}
      aria-label={label}
    >
      <span className="w-6 shrink-0 text-right">{w}%</span>
      <div className="flex h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-800 ring-1 ring-neutral-300">
        <div className="h-full bg-white" style={{ width: `${w}%` }} />
      </div>
      <span className="w-6 shrink-0 text-left">{b}%</span>
    </div>
  )
}
