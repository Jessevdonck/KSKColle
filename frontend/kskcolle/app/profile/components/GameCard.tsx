import { GameWithRoundAndTournament } from "@/data/types"
import { Card, CardContent } from "@/components/ui/card"

interface GameCardProps {
  game: GameWithRoundAndTournament
  playerId: number
  compact?: boolean
}

export function GameCard({ game, playerId, compact }: GameCardProps) {
  const whitePlayerName = game.speler1_naam
  const blackPlayerName = game.speler2_naam
  const result = getGameResult(game, playerId)
  const isProfilePlayerWhite = game.speler1_id === playerId

  return (
    <Card className={compact ? "border border-border/40" : undefined}>
      <CardContent className={compact ? "p-1.5" : "p-2"}>
        <div className={compact
          ? "grid grid-cols-[50px_minmax(0,1fr)_minmax(0,1fr)_minmax(72px,auto)] gap-1.5 text-xs"
          : "grid grid-cols-[80px_220px_1fr_100px] gap-3 text-sm"
        }>
          {/* Date */}
          {game.round && (
            <span className={`text-muted-foreground whitespace-nowrap self-center ${compact ? "text-[11px]" : "text-xs"}`}>
              {new Date(game.round.ronde_datum).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </span>
          )}
          
          {/* Tournament and Round */}
          {game.round && (
            <span className={`text-muted-foreground self-center truncate ${compact ? "text-[11px]" : "text-xs"}`} title={game.round.tournament?.naam || 'Onbekend'}>
              {compact ? (game.round.tournament?.naam?.slice(0, 14) || 'Onbekend') + (game.round.tournament?.naam && game.round.tournament.naam.length > 14 ? '…' : '') + ` R${game.round.ronde_nummer}` : `${game.round.tournament?.naam || 'Onbekend'} R${game.round.ronde_nummer}`}
            </span>
          )}
          
          {/* Players - wit en zwart onder elkaar */}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-2.5 w-2.5 bg-gray-300 rounded-full flex-shrink-0" />
              <span className={isProfilePlayerWhite ? "font-semibold text-textColor truncate" : "truncate text-xs"}>
                {whitePlayerName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-2.5 w-2.5 bg-gray-700 rounded-full flex-shrink-0" />
              <span className={!isProfilePlayerWhite ? "font-semibold text-textColor truncate" : "truncate text-xs"}>
                {blackPlayerName}
              </span>
            </div>
          </div>
          
          {/* Result — vaste ruimte, geen overflow */}
          <div className="min-w-[72px] overflow-hidden flex justify-end items-center shrink-0">
            <span className={`font-bold truncate text-right max-w-full block ${compact ? "text-xs" : "text-sm"} ${getResultColor(result)}`} title={result}>
              {result}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getGameResult(game: GameWithRoundAndTournament, playerId: number): string {
  const result = game.result?.trim() ?? '';

  if (result === '' || result === '...') return 'Nog te spelen';
  if (result.toLowerCase() === 'uitgesteld') return 'Uitgesteld';

  // Remise (verschillende formaten)
  if (['½-½', '1/2-1/2', '�-�'].includes(result)) {
    return '½-½';
  }

  const isWhite = game.speler1_id === playerId;
  const isBlack = game.speler2_id === playerId;

  if((result === '1-0R' && isWhite)) {
    return 'Gewonnen FF';
  } 
  if((result === '1-0R' && isBlack)) {
    return 'Verloren FF';
  }
  // Gewonnen
  if ((result.startsWith('1-0') && isWhite) || (result.startsWith('0-1') && isBlack)) {
    return 'Gewonnen';
  }

  // Verloren
  if ((result.startsWith('0-1') && isWhite) || (result.startsWith('1-0') && isBlack)) {
    return 'Verloren';
  }

  return result; // fallback voor ongewone codes
}


function getResultColor(result: string): string {
  switch (result) {
    case 'Gewonnen':
      return 'text-green-600'
    case 'Verloren':
      return 'text-red-600'
    case '½-½':
      return 'text-yellow-600'
    case 'Nog te spelen':
      return 'text-blue-600'
    case 'Uitgesteld':
      return 'text-orange-600'
    default:
      return 'text-muted-foreground'
  }
}
