import { auth as googleAuth, drive as googleDrive, type drive_v3 } from '@googleapis/drive';

/**
 * Drive-client wordt lui aangemaakt: pas bij het eerste fotoverzoek.
 * Zo kost de foto-integratie niets zolang niemand de galerij opent, en
 * start de server ook zonder GOOGLE_SERVICE_ACCOUNT_KEY.
 */
let driveClient: drive_v3.Drive | null = null;

function getDrive(): drive_v3.Drive {
  if (driveClient) return driveClient;

  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is niet ingesteld');
  }

  const client = new googleAuth.GoogleAuth({
    credentials: JSON.parse(rawKey),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  driveClient = googleDrive({ version: 'v3', auth: client });
  return driveClient;
}

export async function listAlbums(rootFolderId: string) {
  const res = await getDrive().files.list({
    q: `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
  });
  return res.data.files || [];
}

export async function listPhotos(albumId: string) {
  const res = await getDrive().files.list({
    q: `'${albumId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: 'files(id, name, thumbnailLink, webContentLink)',
  });
  return (res.data.files || []).map(f => ({
    id: f.id!,
    title: f.name,
    // Use thumbnail with sz parameter to get larger version
    thumbnail: f.thumbnailLink?.replace('=s220', '=s600') || f.thumbnailLink!, // 600px thumbnail
    downloadUrl: f.webContentLink!,
    // Use 600px for grid (fast and decent quality)
    optimizedUrl: `https://drive.google.com/uc?export=view&id=${f.id!}&w=600`,
    // Use 800px for lightbox (good quality, reasonably fast)
    highQualityUrl: `https://drive.google.com/uc?export=view&id=${f.id!}&w=800`
  }));
}
