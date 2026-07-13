import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { StorageProvider } from './StorageProvider.js';
import { env } from '../config/env.js';

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export class LocalStorageProvider extends StorageProvider {
  constructor(baseDir = env.UPLOADS_DIR) {
    super();
    this.baseDir = path.resolve(baseDir);
  }

  async upload(file) {
    const ext =
      EXT_BY_MIME[file.mimeType] ?? path.extname(file.originalName) ?? '';
    const key = `${randomUUID()}${ext}`;
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(path.join(this.baseDir, key), file.buffer);
    return { key, url: this.getUrl(key) };
  }

  getUrl(key) {
    return `${env.PUBLIC_BASE_URL}/uploads/${key}`;
  }

  async delete(key) {
    // Guard against path traversal — key must resolve inside baseDir.
    const target = path.resolve(this.baseDir, key);
    if (!target.startsWith(this.baseDir + path.sep)) return;
    await fs.rm(target, { force: true });
  }
}
