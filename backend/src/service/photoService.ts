import { google } from 'googleapis';
const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ['https://www.googleapis.com/auth/drive.readonly']
});
const drive = google.drive({ version: 'v3', auth });

export async function listAlbums(rootFolderId: string) {
  const res = await drive.files.list({
    q: `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
  });
  return res.data.files || [];
}

export async function listPhotos(albumId: string) {
  const res = await drive.files.list({
    q: `'${albumId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: 'files(id, name, thumbnailLink, webContentLink)',
  });
  return (res.data.files || []).map(f => ({
    id: f.id!,
    title: f.name,
    thumbnail: f.thumbnailLink!,
    downloadUrl: f.webContentLink!
  }));
}
