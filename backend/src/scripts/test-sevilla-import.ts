import { SevillaImporterService } from '../service/sevillaImporterService';
import * as fs from 'fs';
import * as path from 'path';

async function testSevillaImport() {
  try {
    console.log('🚀 Testing Sevilla import...');
    
    // Load the Sevilla data
    const sevillaFilePath = path.join(__dirname, '../data/sevilla/Herfstcompetitie_2025-2026.json');
    const sevillaData = JSON.parse(fs.readFileSync(sevillaFilePath, 'utf8'));
    
    console.log(`📁 Loaded Sevilla data: ${sevillaData.Name}`);
    
    // Create importer service
    const importer = new SevillaImporterService();
    
    // Validate data first
    const isValid = await importer.validateSevillaData(sevillaData);
    console.log(`✅ Data validation: ${isValid ? 'PASSED' : 'FAILED'}`);
    
    if (!isValid) {
      console.error('❌ Invalid Sevilla data format');
      return;
    }
    
    // Import tournament
    console.log('📥 Importing tournament...');
    const tournamentId = await importer.importTournament(sevillaData, 'Herfstcompetitie 2025-2026', false);
    
    console.log(`✅ Tournament imported successfully with ID: ${tournamentId}`);
    
  } catch (error) {
    console.error('❌ Error during Sevilla import test:', error);
  }
}

// Run the test
testSevillaImport().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
