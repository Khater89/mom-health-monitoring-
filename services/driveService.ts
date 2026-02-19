
import { STORAGE_KEYS } from '../constants';

// NOTE: You must replace this with your own Client ID from Google Cloud Console
// Enable "Google Drive API" in your project.
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
const API_KEY = process.env.API_KEY || ''; 
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const BACKUP_FILE_NAME = "aman_health_backup.json";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initGoogleDrive = async (callback: (isSignedIn: boolean) => void) => {
  if (gapiInited && gisInited) return;

  const gapiLoadPromise = new Promise<void>((resolve) => {
    window.gapi.load('client', async () => {
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
      });
      gapiInited = true;
      // Check if already signed in
      const token = window.gapi.client.getToken();
      callback(!!token);
      resolve();
    });
  });

  const gisLoadPromise = new Promise<void>((resolve) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.error !== undefined) {
          throw (resp);
        }
        callback(true);
      },
    });
    gisInited = true;
    resolve();
  });

  return Promise.all([gapiLoadPromise, gisLoadPromise]);
};

export const handleAuthClick = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }
};

export const handleSignOutClick = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
    return false;
  }
  return true;
};

/**
 * Creates a backup of all local storage data to Google Drive
 */
export const backupToDrive = async () => {
  try {
    const dataToSave = {
      records: JSON.parse(localStorage.getItem(STORAGE_KEYS.RECORDS) || '[]'),
      meds: JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDS) || '[]'),
      profile: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || '{}'),
      backupDate: new Date().toISOString()
    };

    const fileContent = JSON.stringify(dataToSave, null, 2);
    const file = new Blob([fileContent], { type: 'application/json' });
    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
    };

    // Check if file exists to update it
    const existingFileId = await findFileId(BACKUP_FILE_NAME);

    const accessToken = window.gapi.client.getToken().access_token;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    if (existingFileId) {
      url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
      method = 'PATCH';
    }

    const response = await fetch(url, {
      method: method,
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form,
    });

    return await response.json();
  } catch (error) {
    console.error("Backup failed", error);
    throw error;
  }
};

/**
 * Restores data from Google Drive to local storage
 */
export const restoreFromDrive = async () => {
  try {
    const fileId = await findFileId(BACKUP_FILE_NAME);
    if (!fileId) throw new Error("لم يتم العثور على ملف نسخ احتياطي");

    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    const data = response.result;
    
    if (data.records) localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(data.records));
    if (data.meds) localStorage.setItem(STORAGE_KEYS.MEDS, JSON.stringify(data.meds));
    if (data.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));

    // Dispatch event to update components
    window.dispatchEvent(new Event('storage'));
    return data.backupDate;
  } catch (error) {
    console.error("Restore failed", error);
    throw error;
  }
};

async function findFileId(name: string) {
  const response = await window.gapi.client.drive.files.list({
    q: `name = '${name}' and trashed = false`,
    fields: 'files(id, name)',
  });
  const files = response.result.files;
  if (files && files.length > 0) {
    return files[0].id;
  }
  return null;
}
