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
    const { sevillaData, tournamentName } = ctx.request.body as { sevillaData: any; tournamentName?: string };

    if (!sevillaData) {
      ctx.status = 400;
      ctx.body = { error: 'Sevilla data is required' };
      return;
    }

    // Validate Sevilla data
    const isValid = await sevillaImporter.validateSevillaData(sevillaData);
    if (!isValid) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid Sevilla data format' };
      return;
    }

    // Import tournament
    const tournamentId = await sevillaImporter.importTournament(sevillaData, tournamentName);

    ctx.status = 201;
    ctx.body = {
      message: 'Tournament imported successfully',
      tournamentId,
    };
  } catch (error) {
    console.error('Error importing Sevilla tournament:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to import tournament' };
  }
});

  // Validate Sevilla data without importing
  router.post('/sevilla/validate', requireAuthentication, requireAdmin, async (ctx) => {
  try {
    const { sevillaData } = ctx.request.body as { sevillaData: any };

    if (!sevillaData) {
      ctx.status = 400;
      ctx.body = { error: 'Sevilla data is required' };
      return;
    }

    const isValid = await sevillaImporter.validateSevillaData(sevillaData);
    
    ctx.status = 200;
    ctx.body = {
      valid: isValid,
      message: isValid ? 'Sevilla data is valid' : 'Invalid Sevilla data format',
    };
  } catch (error) {
    console.error('Error validating Sevilla data:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to validate Sevilla data' };
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
    ctx.body = { error: 'Failed to load sample data' };
  }
});

};
