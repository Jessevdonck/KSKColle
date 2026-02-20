/**
 * Vervang een speler die forfait geeft in Megaschaak door de reservespeler in elk team dat hem geselecteerd heeft.
 *
 * Gebruik: npx tsx src/scripts/replace-megaschaak-forfait.ts "Voornaam Achternaam"
 * Voorbeeld: npx tsx src/scripts/replace-megaschaak-forfait.ts "Thijs Vermeulen"
 *
 * Voor elk team dat de speler in de basis heeft en een reserve heeft:
 * - De speler in MegaschaakTeamPlayer wordt vervangen door de reservespeler van dat team
 * - De reserve van dat team wordt op null gezet (die is nu "gebruikt")
 *
 * Teams zonder reserve worden overgeslagen; je krijgt een melding.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const nameArg = process.argv[2];
  if (!nameArg) {
    console.error("Gebruik: npx tsx src/scripts/replace-megaschaak-forfait.ts \"Voornaam Achternaam\"");
    console.error('Voorbeeld: npx tsx src/scripts/replace-megaschaak-forfait.ts "Thijs Vermeulen"');
    process.exit(1);
  }

  const parts = nameArg.trim().split(/\s+/);
  if (parts.length < 2) {
    console.error("Geef de volledige naam (voornaam + achternaam).");
    process.exit(1);
  }
  const voornaam = parts[0];
  const achternaam = parts.slice(1).join(" ");
  if (voornaam === undefined) {
    console.error("Geef de volledige naam (voornaam + achternaam).");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { voornaam, achternaam },
  });

  if (!user) {
    console.error(`Geen gebruiker gevonden voor "${voornaam} ${achternaam}".`);
    process.exit(1);
  }

  console.log(`Gevonden: ${user.voornaam} ${user.achternaam} (user_id=${user.user_id})\n`);

  const teamPlayers = await prisma.megaschaakTeamPlayer.findMany({
    where: { player_id: user.user_id },
    include: {
      team: {
        include: {
          tournament: true,
          reserve_player: true,
          user: true,
        },
      },
    },
  });

  if (teamPlayers.length === 0) {
    console.log("Deze speler staat in geen enkel Megaschaak-team. Niets te doen.");
    return;
  }

  const withReserve = teamPlayers.filter((tp) => tp.team.reserve_player_id != null);
  const withoutReserve = teamPlayers.filter((tp) => tp.team.reserve_player_id == null);

  if (withoutReserve.length > 0) {
    console.log(
      `Waarschuwing: ${withoutReserve.length} team(s) hebben deze speler maar geen reserve (worden overgeslagen):`
    );
    for (const tp of withoutReserve) {
      console.log(`  - Team "${tp.team.team_name}" (eigenaar: ${tp.team.user.voornaam} ${tp.team.user.achternaam})`);
    }
    console.log("");
  }

  if (withReserve.length === 0) {
    console.log("Geen enkel team heeft zowel deze speler als een reserve. Niets gewijzigd.");
    return;
  }

  console.log(`Vervangen in ${withReserve.length} team(s):\n`);

  for (const tp of withReserve) {
    const team = tp.team;
    const reserveId = team.reserve_player_id!;
    const reserveCost = team.reserve_cost ?? 0;
    const reserve = team.reserve_player!;

    await prisma.$transaction([
      prisma.megaschaakTeamPlayer.update({
        where: { id: tp.id },
        data: { player_id: reserveId, cost: reserveCost },
      }),
      prisma.megaschaakTeam.update({
        where: { team_id: team.team_id },
        data: { reserve_player_id: null, reserve_cost: null },
      }),
    ]);

    console.log(
      `  ✓ "${team.team_name}" (${team.user.voornaam} ${team.user.achternaam}): ${user.voornaam} ${user.achternaam} → ${reserve.voornaam} ${reserve.achternaam} (reserve)`
    );
  }

  console.log("\nKlaar.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
