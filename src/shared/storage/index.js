import { LocalStorageProvider } from './LocalStorageProvider.js';

// Single place that decides which provider the app uses.
// To switch to Cloudinary/S3 later: implement the provider, change this line.
export const storage = new LocalStorageProvider();

export { StorageProvider } from './StorageProvider.js';
