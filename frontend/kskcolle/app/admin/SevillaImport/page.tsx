'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import useSWRMutation from 'swr/mutation';
import * as api from '../../api';

export default function SevillaImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [tournamentName, setTournamentName] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  const [importMode, setImportMode] = useState<'full' | 'incremental'>('full');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    tournamentId?: number;
    incremental?: boolean;
  } | null>(null);

  // SWR mutations
  const { isMutating: isValidating, trigger: validateData } = useSWRMutation(
    'sevilla/validate',
    async (url, { arg }: { arg: { sevillaData: any } }) => {
      const response = await api.axios.post(`/${url}`, arg);
      return response.data;
    }
  );

  const { isMutating: isImporting, trigger: importTournamentData } = useSWRMutation(
    'sevilla/import',
    async (url, { arg }: { arg: { sevillaData: any; tournamentName?: string; incremental?: boolean } }) => {
      const response = await api.axios.post(`/${url}`, arg);
      return response.data;
    }
  );

  const { trigger: loadSample } = useSWRMutation(
    'sevilla/sample',
    async (url) => {
      const response = await api.axios.get(`/${url}`);
      return response.data;
    }
  );

  /**
   * Sevilla exporteert doorgaans in Windows-1252, niet in UTF-8. Lezen we zo'n
   * bestand als UTF-8, dan wordt elk accentteken een vervangingsteken (�) en
   * belandt bijvoorbeeld "Björn" verminkt in de database.
   * We proberen daarom eerst strikt UTF-8 en vallen bij ongeldige bytes terug
   * op Windows-1252, zodat beide exportvarianten correct ingelezen worden.
   */
  const decodeSevillaFile = (buffer: ArrayBuffer): string => {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      return new TextDecoder('windows-1252').decode(buffer);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setJsonContent('');
      setValidationResult(null);
      setImportResult(null);

      const buffer = await uploadedFile.arrayBuffer();
      setJsonContent(decodeSevillaFile(buffer));
    }
  };

  const handleJsonPaste = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = event.target.value;
    setJsonContent(content);
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
  };

  const loadSampleData = async () => {
    try {
      const sampleData = await loadSample();
      setJsonContent(JSON.stringify(sampleData, null, 2));
      setFile(null);
      setValidationResult(null);
      setImportResult(null);
    } catch (error) {
      console.error('Error loading sample data:', error);
    }
  };

  const validateSevillaData = async () => {
    if (!jsonContent.trim()) {
      setValidationResult({
        valid: false,
        message: 'Upload een bestand of plak JSON inhoud',
      });
      return;
    }

    try {
      // First try to parse the JSON
      let sevillaData;
      try {
        sevillaData = JSON.parse(jsonContent);
      } catch (parseError) {
        setValidationResult({
          valid: false,
          message: 'Ongeldig JSON formaat. Controleer uw bestand of geplakte inhoud.',
        });
        return;
      }
      
      const result = await validateData({ sevillaData });
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        valid: false,
        message: 'Validatie mislukt. Controleer uw verbinding en probeer opnieuw.',
      });
    }
  };

  const importTournament = async () => {
    if (!jsonContent.trim()) {
      setImportResult({
        success: false,
        message: 'Upload een bestand of plak JSON inhoud',
      });
      return;
    }

    if (!validationResult?.valid) {
      setImportResult({
        success: false,
        message: 'Valideer de gegevens eerst',
      });
      return;
    }

    try {
      // First try to parse the JSON
      let sevillaData;
      try {
        sevillaData = JSON.parse(jsonContent);
      } catch (parseError) {
        setImportResult({
          success: false,
          message: 'Ongeldig JSON formaat. Valideer de gegevens eerst.',
        });
        return;
      }
      
      const result = await importTournamentData({ 
        sevillaData,
        tournamentName: tournamentName || undefined,
        incremental: importMode === 'incremental',
      });
      
      setImportResult({
        success: true,
        message: result.message,
        tournamentId: result.tournamentId,
        incremental: result.incremental,
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: 'Import mislukt. Controleer uw verbinding en probeer opnieuw.',
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="bg-mainAccent/10 p-2 rounded-lg">
          <Upload className="h-5 w-5 text-mainAccent" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-textColor">Sevilla Toernooi Import</h1>
          <p className="text-muted-foreground text-xs">
            Importeer toernooigegevens van Sevilla (.json) bestanden naar uw systeem.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* File Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-mainAccent">
              <Upload className="h-4 w-4" />
              Sevilla Bestand Uploaden
            </CardTitle>
            <CardDescription className="text-xs">
              Upload een .json bestand geëxporteerd uit Sevilla of plak de JSON inhoud direct.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="file-upload" className="text-sm">Kies Bestand</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="mt-1"
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-1.5">
                  Geselecteerd: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="json-content" className="text-sm">Of Plak JSON Inhoud</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadSampleData}
                  className="text-xs"
                >
                  Laad Voorbeelddata
                </Button>
              </div>
              <Textarea
                id="json-content"
                placeholder="Plak uw Sevilla JSON inhoud hier..."
                value={jsonContent}
                onChange={handleJsonPaste}
                rows={8}
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="tournament-name" className="text-sm">Toernooi Naam (Optioneel)</Label>
              <Input
                id="tournament-name"
                placeholder="Laat leeg om naam uit Sevilla bestand te gebruiken"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Validation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-mainAccent">
              <FileText className="h-4 w-4" />
              Valideer Gegevens
            </CardTitle>
            <CardDescription className="text-xs">
              Valideer de Sevilla gegevens voor het importeren om te zorgen dat het in het juiste formaat is.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={validateSevillaData}
              disabled={isValidating || !jsonContent.trim()}
              variant="accent"
              className="w-full"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Valideren...
                </>
              ) : (
                'Valideer Gegevens'
              )}
            </Button>

            {validationResult && (
              <Alert className={`mt-3 ${validationResult.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                {validationResult.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={validationResult.valid ? 'text-green-800' : 'text-red-800'}>
                  {validationResult.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-mainAccent">
              <CheckCircle className="h-4 w-4" />
              Importeer Toernooi
            </CardTitle>
            <CardDescription className="text-xs">
              Importeer de gevalideerde toernooigegevens naar uw systeem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Import Mode Selection */}
            <div>
              <Label htmlFor="import-mode" className="text-sm">Import Modus</Label>
              <div className="mt-1.5 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <input
                    id="import-mode-full"
                    type="radio"
                    name="import-mode"
                    value="full"
                    checked={importMode === 'full'}
                    onChange={(e) => setImportMode(e.target.value as 'full' | 'incremental')}
                    className="h-4 w-4 text-mainAccent focus:ring-mainAccent"
                  />
                  <Label htmlFor="import-mode-full" className="text-sm font-normal">
                    <strong>Volledige Import:</strong> Maak een nieuw toernooi (of vervang bestaande)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="import-mode-incremental"
                    type="radio"
                    name="import-mode"
                    value="incremental"
                    checked={importMode === 'incremental'}
                    onChange={(e) => setImportMode(e.target.value as 'full' | 'incremental')}
                    className="h-4 w-4 text-mainAccent focus:ring-mainAccent"
                  />
                  <Label htmlFor="import-mode-incremental" className="text-sm font-normal">
                    <strong>Incrementele Import:</strong> Update bestaand toernooi met nieuwe/bijgewerkte rondes
                  </Label>
                </div>
              </div>
              {importMode === 'incremental' && (
                <div className="mt-1.5 p-2.5 bg-mainAccent/10 border border-mainAccent/20 rounded-md">
                  <p className="text-sm text-textColor">
                    <strong>Opmerking:</strong> Dit voegt nieuwe rondes toe en update bestaande rondes met wijzigingen.
                    Perfect voor wekelijkse updates wanneer resultaten worden gecorrigeerd of nieuwe rondes worden toegevoegd.
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={importTournament}
              disabled={isImporting || !validationResult?.valid}
              variant="accent"
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {importMode === 'incremental' ? 'Updaten...' : 'Importeren...'}
                </>
              ) : (
                importMode === 'incremental' ? 'Update Toernooi' : 'Importeer Toernooi'
              )}
            </Button>

            {importResult && (
              <Alert className={`mt-3 ${importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                {importResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={importResult.success ? 'text-green-800' : 'text-red-800'}>
                  {importResult.message}
                  {importResult.tournamentId && (
                    <div className="mt-2 space-y-1">
                      <div>
                        <strong>Toernooi ID:</strong> {importResult.tournamentId}
                      </div>
                      {importResult.incremental !== undefined && (
                        <div>
                          <strong>Modus:</strong> {importResult.incremental ? 'Incrementele Update' : 'Volledige Import'}
                        </div>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
