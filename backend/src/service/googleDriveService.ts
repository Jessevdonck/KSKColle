import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});
const drive = google.drive({ version: 'v3', auth });

export async function listAlbums() {
  const root = process.env.DRIVE_ROOT_FOLDER_ID!;
  const res = await drive.files.list({
    q: `'${root}' in parents
        and mimeType='application/vnd.google-apps.folder'
        and trashed=false`,
    fields: 'files(id, name)',
    orderBy: 'name',
  });
  return res.data.files || [];
}

export async function listPhotosInAlbum(folderId: string) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents
        and mimeType contains 'image/'
        and trashed=false`,
    fields: 'files(id, name, mimeType, thumbnailLink, webContentLink)',
    orderBy: 'name',
  });
  return res.data.files || [];
}
