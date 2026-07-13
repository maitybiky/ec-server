/**
 * Abstract storage provider — image/file storage contract.
 * Swap implementations (local disk, Cloudinary, S3) without touching callers.
 */
export class StorageProvider {
  /**
   * Persist a file buffer.
   * @param {{ buffer: Buffer, originalName: string, mimeType: string }} file
   * @returns {Promise<{ key: string, url: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async upload(file) {
    throw new Error('StorageProvider.upload not implemented');
  }

  /**
   * Public URL for a stored file key.
   * @param {string} key
   * @returns {string}
   */
  // eslint-disable-next-line no-unused-vars
  getUrl(key) {
    throw new Error('StorageProvider.getUrl not implemented');
  }

  /**
   * Remove a stored file.
   * @param {string} key
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async delete(key) {
    throw new Error('StorageProvider.delete not implemented');
  }
}
