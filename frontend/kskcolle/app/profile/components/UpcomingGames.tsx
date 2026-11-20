"use client";

import React from "react";
import { GameWithRoundAndTournament } from "@/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameCard } from "./GameCard";
import { ListPager, usePaged } from "./ListPager";

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
  const sortedGames = [...games].sort(
    (a, b) =>
      new Date(a.round.ronde_datum).getTime() -
      new Date(b.round.ronde_datum).getTime(),
  );

  const { page, pageCount, setPage, visible: visibleGames } = usePaged(sortedGames, undefined, playerId);

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

  return (
    <Card className="w-full border border-border/50">
      <CardHeader className={compact ? "py-3 px-4" : undefined}>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className={compact ? "text-sm font-semibold" : undefined}>
            Nog te spelen / in te halen ({sortedGames.length})
          </CardTitle>
          <ListPager page={page} pageCount={pageCount} setPage={setPage} />
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
