import { SevillaImporterService } from '../service/sevillaImporterService';
import * as fs from 'fs';
import * as path from 'path';

async function importSevillaTournament() {
  try {
    console.log('Starting Sevilla tournament import...');
    
    // Read the Sevilla JSON file
    const sevillaFilePath = path.join(__dirname, '../data/sevilla/Herfstcompetitie_2024.json');
    const sevillaData = JSON.parse(fs.readFileSync(sevillaFilePath, 'utf8'));
    
    console.log(`Loaded Sevilla data: ${sevillaData.Name}`);
    console.log(`Groups: ${sevillaData.GroupReport.length}`);
    
    // Validate the data
    const importer = new SevillaImporterService();
    const isValid = await importer.validateSevillaData(sevillaData);
    
    if (!isValid) {
      console.error('Invalid Sevilla data format');
      process.exit(1);
    }
    
    console.log('Sevilla data is valid, proceeding with import...');
    
    // Import the tournament
    const tournamentId = await importer.importTournament(sevillaData, 'Herfstcompetitie 2024 (Sevilla Import)');
    
    console.log(`✅ Successfully imported tournament with ID: ${tournamentId}`);
    console.log('You can now view the tournament in your application.');
    
  } catch (error) {
    console.error('❌ Error importing Sevilla tournament:', error);
    process.exit(1);
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importSevillaTournament()
    .then(() => {
      console.log('Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

export { importSevillaTournament };

