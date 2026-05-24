export const activeMegaschaakTournamentInclude = {
  participations: {
    include: {
      user: {
        select: {
          user_id: true,
          voornaam: true,
          achternaam: true,
          schaakrating_elo: true,
          is_youth: true,
          avatar_url: true,
        },
      },
    },
  },
} as const;
