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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setJsonContent('');
      setValidationResult(null);
      setImportResult(null);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonContent(content);
      };
      reader.readAsText(uploadedFile);
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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sevilla Toernooi Import</h1>
        <p className="text-muted-foreground">
          Importeer toernooigegevens van Sevilla (.json) bestanden naar uw systeem.
        </p>
      </div>

      <div className="grid gap-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Sevilla Bestand Uploaden
            </CardTitle>
            <CardDescription>
              Upload een .json bestand geëxporteerd uit Sevilla of plak de JSON inhoud direct.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Kies Bestand</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="mt-1"
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-2">
                  Geselecteerd: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="json-content">Of Plak JSON Inhoud</Label>
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
              <Label htmlFor="tournament-name">Toernooi Naam (Optioneel)</Label>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Valideer Gegevens
            </CardTitle>
            <CardDescription>
              Valideer de Sevilla gegevens voor het importeren om te zorgen dat het in het juiste formaat is.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={validateSevillaData}
              disabled={isValidating || !jsonContent.trim()}
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
              <Alert className={`mt-4 ${validationResult.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Importeer Toernooi
            </CardTitle>
            <CardDescription>
              Importeer de gevalideerde toernooigegevens naar uw systeem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Import Mode Selection */}
            <div>
              <Label htmlFor="import-mode">Import Modus</Label>
              <div className="mt-2 space-y-2">
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
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Opmerking:</strong> Dit voegt nieuwe rondes toe en update bestaande rondes met wijzigingen. 
                    Perfect voor wekelijkse updates wanneer resultaten worden gecorrigeerd of nieuwe rondes worden toegevoegd.
                  </p>
                </div>
              )}
            </div>

            <Button 
              onClick={importTournament}
              disabled={isImporting || !validationResult?.valid}
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
              <Alert className={`mt-4 ${importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
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
