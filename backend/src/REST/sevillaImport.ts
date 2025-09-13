import Router from '@koa/router';
import { SevillaImporterService } from '../service/sevillaImporterService';
import { requireAuthentication, makeRequireRole } from '../core/auth';
import type { ChessAppContext, ChessAppState } from '../types/koa';

const sevillaImporter = new SevillaImporterService();

export default (router: Router<ChessAppState, ChessAppContext>) => {
  const requireAdmin = makeRequireRole('admin');
  
  // Import Sevilla tournament
  router.post('/sevilla/import', requireAuthentication, requireAdmin, async (ctx) => {
  try {
    const { sevillaData, tournamentName, incremental, totalRounds } = ctx.request.body as { 
      sevillaData: any; 
      tournamentName?: string; 
      incremental?: boolean;
      totalRounds?: number;
    };

    if (!sevillaData) {
      ctx.status = 400;
      ctx.body = { error: 'Sevilla gegevens zijn vereist' };
      return;
    }

    // Validate Sevilla data
    const isValid = await sevillaImporter.validateSevillaData(sevillaData);
    if (!isValid) {
      ctx.status = 400;
      ctx.body = { error: 'Ongeldig Sevilla data formaat' };
      return;
    }

    // Import tournament (incremental or full)
    const tournamentId = await sevillaImporter.importTournament(sevillaData, tournamentName, incremental || false, totalRounds);

    ctx.status = 201;
    ctx.body = {
      message: incremental ? 'Toernooi succesvol bijgewerkt' : 'Toernooi succesvol geïmporteerd',
      tournamentId,
      incremental: incremental || false,
    };
  } catch (error) {
    console.error('Error importing Sevilla tournament:', error);
    ctx.status = 500;
    ctx.body = { error: 'Import van toernooi mislukt' };
  }
});

  // Incremental import Sevilla tournament (only new rounds)
  router.post('/sevilla/import/incremental', requireAuthentication, requireAdmin, async (ctx) => {
  try {
    const { sevillaData, tournamentName } = ctx.request.body as { 
      sevillaData: any; 
      tournamentName?: string; 
    };

    if (!sevillaData) {
      ctx.status = 400;
      ctx.body = { error: 'Sevilla gegevens zijn vereist' };
      return;
    }

    // Validate Sevilla data
    const isValid = await sevillaImporter.validateSevillaData(sevillaData);
    if (!isValid) {
      ctx.status = 400;
      ctx.body = { error: 'Ongeldig Sevilla data formaat' };
      return;
    }

    // Import tournament incrementally
    const tournamentId = await sevillaImporter.importTournament(sevillaData, tournamentName, true);

    ctx.status = 201;
    ctx.body = {
      message: 'Toernooi succesvol bijgewerkt (incrementeel)',
      tournamentId,
      incremental: true,
    };
  } catch (error) {
    console.error('Error importing Sevilla tournament incrementally:', error);
    ctx.status = 500;
    ctx.body = { error: 'Incrementele import van toernooi mislukt' };
  }
});

  // Validate Sevilla data without importing
  router.post('/sevilla/validate', requireAuthentication, requireAdmin, async (ctx) => {
  try {
    const { sevillaData } = ctx.request.body as { sevillaData: any };

    if (!sevillaData) {
      ctx.status = 400;
      ctx.body = { error: 'Sevilla gegevens zijn vereist' };
      return;
    }

    const isValid = await sevillaImporter.validateSevillaData(sevillaData);
    
    ctx.status = 200;
    ctx.body = {
      valid: isValid,
      message: isValid ? 'Sevilla gegevens zijn geldig' : 'Ongeldig Sevilla data formaat',
    };
  } catch (error) {
    console.error('Error validating Sevilla data:', error);
    ctx.status = 500;
    ctx.body = { error: 'Validatie van Sevilla gegevens mislukt' };
  }
});

  // Get sample Sevilla data
  router.get('/sevilla/sample', requireAuthentication, requireAdmin, async (ctx) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const sevillaFilePath = path.join(__dirname, '../data/sevilla/Herfstcompetitie_2024.json');
    const sevillaData = JSON.parse(fs.readFileSync(sevillaFilePath, 'utf8'));
    
    ctx.status = 200;
    ctx.body = sevillaData;
  } catch (error) {
    console.error('Error loading sample Sevilla data:', error);
    ctx.status = 500;
    ctx.body = { error: 'Laden van voorbeelddata mislukt' };
  }
});

};
