export interface StoredFile {
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StorageProvider {
  saveFile(params: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    field: string;
  }): Promise<StoredFile>;

  saveFromPath(params: {
    sourcePath: string;
    originalName: string;
    mimeType: string;
    field: string;
  }): Promise<StoredFile>;

  getFileUrl(key: string): string;

  deleteFile(key: string): Promise<void>;
}
