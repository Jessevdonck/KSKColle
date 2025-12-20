import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// PrismaClient will automatically use DATABASE_URL from environment variables
const prisma = new PrismaClient();

// Mapping van speler naam naar BCut (Buchholz-worst) uit de screenshots
// Deze mapping is gebaseerd op de screenshots die de gebruiker heeft gestuurd
const BCUT_MAPPING: Record<string, number> = {
  // Pos 1-4 uit de screenshots (BCut kolom)
  'Pieter-Jan Orban': 26.0, // Pos 1 (uit tweede screenshot)
  'Ronny Hanssen': 27.0, // Pos 2 (uit tweede screenshot)
  'Niels Ongena': 26.0, // Pos 3 (uit tweede screenshot)
  'Peter Verbruggen': 28.0, // Pos 4 (uit tweede screenshot, geschat)
  // Pos 5-53 uit de screenshots (BCut kolom)
  'Jan Van der Stricht': 23.5,
  'Matthias Baes': 23.0,
  'Dirk Janssens': 21.5,
  'Benjamin Vermassen': 30.0,
  'Giovanni Beniers': 29.5,
  'Koen Van den Boss': 29.5,
  'Koen Van den Bossche': 29.5, // Alternatieve spelling
  'Tijs Elsen': 25.5,
  'Jurgen Vertongen': 24.5,
  'Luc Ruymbeek': 24.5,
  'Frans Van Mullem': 26.5,
  'Stijn De Blende': 25.0,
  'Nils-Oscar De Landt': 24.5,
  'Nils-Oscar De Landtsheer': 24.5, // Volledige naam
  'Wouter Van Hecke': 22.5,
  'Regi Van den Bergh': 21.5,
  'Marc Rotthier': 19.5,
  'Kasper De Blieck': 25.5,
  'Sven Schatteman': 25.5,
  'Ruud Vermeulen': 25.0,
  'Stefan Clarys': 25.0,
  'Patrick Gillis': 24.0,
  'Diego Poeck': 24.0,
  'Dirk Hermans': 23.0,
  'Dirk Lutz': 22.5,
  'Pol Vanfleteren': 22.0,
  'Piet Vermeiren': 21.0,
  'Wim Weyers': 21.0,
  'Herwig Staes': 20.5,
  'Piet Vandeveire': 20.0,
  'Ronny Eelen': 19.0,
  'Maarten Covents': 18.0,
  'Jo Tondeleir': 24.0,
  'Willy Colman': 20.5,
  'Gunther Coppens': 19.5,
  'Stefan Bombeke': 17.5,
  'Kamiel Goeman': 22.5,
  'Marc Ongena': 22.0,
  'Thomas Buys-Devillé': 21.5,
  'Ryan Stockmans': 21.0,
  'Marc Ruymbeek': 19.5,
  'Dries d\'Hooghe': 19.5,
  'Jean-Pierre De Vriendt': 15.5,
  'Peter Van Landeghem': 24.0,
  'Johan Seghers': 21.0,
  'Peter Volckaert': 20.0,
  'David Vertenten': 19.5,
  'Kris Van Broeck': 18.5,
  'Dirk Stynen': 16.0,
  'Heidi Daelman': 14.5,
  'Dirk Heymans': 14.0,
  // Voeg hier meer spelers toe als nodig
};

interface SevillaPlayer {
  Pos: number;
  ID: number;
  Name: string;
  Bhlz: number;
}

interface SevillaTournament {
  Name: string;
  GroupReport: Array<{
    Ranking: Array<{
      Player: SevillaPlayer[];
    }>;
    History?: Array<{
      Player: SevillaPlayer[];
    }>;
  }>;
}

async function fixBuchholzWorst() {
  try {
    console.log('🔧 Starting Buchholz-worst fix script...');
    
    // Lees de Sevilla JSON
    const sevillaFilePath = path.join(__dirname, '../data/sevilla/herfstcompetitie 2025-2026.json');
    const sevillaData: SevillaTournament = JSON.parse(fs.readFileSync(sevillaFilePath, 'utf8'));
    
    console.log(`📁 Loaded Sevilla data: ${sevillaData.Name}`);
    
    // Vind de laatste ranking (finale stand)
    const group = sevillaData.GroupReport[0];
    if (!group || !group.Ranking || group.Ranking.length === 0) {
      throw new Error('No ranking found in Sevilla data');
    }
    
    const finalRanking = group.Ranking[group.Ranking.length - 1];
    if (!finalRanking) {
      throw new Error('No final ranking found');
    }
    const players = finalRanking.Player;
    
    console.log(`📊 Found ${players.length} players in final ranking`);
    
    // Maak een map van speler naam naar BCut uit de mapping
    const bcutMap = new Map<string, number>();
    for (const [name, bcut] of Object.entries(BCUT_MAPPING)) {
      bcutMap.set(normalizeName(name), bcut);
    }
    
    // Vind het toernooi in de database
    const tournamentName = sevillaData.Name;
    // Zoek eerst op exacte naam match, anders op eerste woord
    let tournament = await prisma.tournament.findFirst({
      where: {
        naam: tournamentName,
      },
      include: {
        participations: {
          include: {
            user: true,
          },
        },
      },
    });
    
    // Als niet gevonden, zoek op eerste woord
    if (!tournament) {
      const searchTerm = tournamentName.split(' ')[0]; // Zoek op eerste woord (bijv. "Herfstcompetitie")
      const whereClause: any = {};
      if (searchTerm) {
        whereClause.naam = { contains: searchTerm };
      }
      tournament = await prisma.tournament.findFirst({
        where: whereClause,
        include: {
          participations: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          tournament_id: 'desc', // Neem het meest recente toernooi
        },
      });
    }
    
    if (!tournament) {
      throw new Error(`Tournament not found in database: ${tournamentName}`);
    }
    
    console.log(`🎯 Found tournament: ${tournament.naam} (ID: ${tournament.tournament_id})`);
    
    // Update tie_break voor elke speler
    let updated = 0;
    let notFound = 0;
    
    for (const participation of tournament.participations) {
      // Vind de Sevilla speler op basis van naam
      const sevillaPlayer = players.find(p => {
        const normalizedSevillaName = normalizeName(p.Name);
        const normalizedDbName = normalizeName(`${participation.user.voornaam} ${participation.user.achternaam}`);
        return normalizedSevillaName === normalizedDbName;
      });
      
      if (!sevillaPlayer) {
        console.log(`⚠️  Sevilla player not found for: ${participation.user.voornaam} ${participation.user.achternaam}`);
        notFound++;
        continue;
      }
      
      // Zoek BCut op basis van Sevilla naam
      const bcut = bcutMap.get(normalizeName(sevillaPlayer.Name));
      if (bcut === undefined) {
        console.log(`⚠️  BCut not found in mapping for: ${sevillaPlayer.Name} (ID: ${sevillaPlayer.ID})`);
        notFound++;
        continue;
      }
      
      // Update de database
      await prisma.participation.update({
        where: {
          user_id_tournament_id: {
            user_id: participation.user_id,
            tournament_id: tournament.tournament_id,
          },
        },
        data: {
          tie_break: bcut,
        },
      });
      
      console.log(`✅ Updated ${participation.user.voornaam} ${participation.user.achternaam}: tie_break = ${bcut}`);
      updated++;
    }
    
    console.log(`\n✅ Done! Updated ${updated} players, ${notFound} not found`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .trim();
}

// Run the script
fixBuchholzWorst()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

