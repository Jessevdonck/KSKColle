"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GameWithRoundAndTournament } from "@/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameCard } from "./GameCard";

/** Aantal partijen per pagina, zodat de lijst kort blijft */
const PAGE_SIZE = 5;

interface UpcomingGamesProps {
  games: GameWithRoundAndTournament[];
  playerId: number;
  compact?: boolean;
}

export default function UpcomingGames({
  games,
  playerId,
  compact,
}: UpcomingGamesProps) {
  const [page, setPage] = useState(0);

  const sortedGames = [...games].sort(
    (a, b) =>
      new Date(a.round.ronde_datum).getTime() -
      new Date(b.round.ronde_datum).getTime(),
  );

  const pageCount = Math.max(1, Math.ceil(sortedGames.length / PAGE_SIZE));

  // Andere speler of minder partijen: terug binnen het bereik
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  if (sortedGames.length === 0) {
    return (
      <Card className="w-full border border-border/50">
        <CardHeader className={compact ? "py-3 px-4" : undefined}>
          <CardTitle className={compact ? "text-sm font-semibold" : undefined}>
            Nog te spelen / in te halen
          </CardTitle>
        </CardHeader>
        <CardContent className={compact ? "pt-0 px-4 pb-4" : undefined}>
          <p className="text-muted-foreground text-sm">
            Geen openstaande partijen.
          </p>
        </CardContent>
      </Card>
    );
  }

  const current = Math.min(page, pageCount - 1);
  const visibleGames = sortedGames.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  return (
    <Card className="w-full border border-border/50">
      <CardHeader className={compact ? "py-3 px-4" : undefined}>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className={compact ? "text-sm font-semibold" : undefined}>
            Nog te spelen / in te halen ({sortedGames.length})
          </CardTitle>
          {pageCount > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setPage(Math.max(0, current - 1))}
                disabled={current === 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Vorige pagina"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground min-w-7 text-center tabular-nums">
                {current + 1}/{pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(pageCount - 1, current + 1))}
                disabled={current >= pageCount - 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Volgende pagina"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={compact ? "pt-0 px-4 pb-4" : undefined}>
        <div className="space-y-1">
          {visibleGames.map((game, index) => (
            <GameCard
              key={game.game_id || index}
              game={game}
              playerId={playerId}
              compact={compact}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
