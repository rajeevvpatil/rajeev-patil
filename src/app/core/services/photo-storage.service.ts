import { Injectable } from '@angular/core';

export interface Photo {
    id: string | number;
    src: string;
    alt: string;
    genre: string;
    span?: 'wide' | 'tall' | 'normal';
    isUploaded?: boolean;
}

export interface StoredPhoto {
    id: string;
    genre: string;
    fileName: string;
    dataUrl: string;
    alt: string;
    span?: 'wide' | 'tall' | 'normal';
    uploadedAt: number;
}

const DB_NAME = 'rp-portfolio-photos';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

@Injectable({ providedIn: 'root' })
export class PhotoStorageService {
    private db: IDBDatabase | null = null;

    constructor() {
        this.openDb();
    }

    private openDb(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (this.db) { resolve(this.db); return; }
            const req = indexedDB.open(DB_NAME, DB_VERSION);

            req.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('genre', 'genre', { unique: false });
                }
            };

            req.onsuccess = (e) => {
                this.db = (e.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };

            req.onerror = () => reject(req.error);
        });
    }

    async savePhoto(photo: StoredPhoto): Promise<void> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const req = tx.objectStore(STORE_NAME).put(photo);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async getPhotosByGenre(genre: string): Promise<StoredPhoto[]> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('genre');
            const req = index.getAll(genre);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    async getAllPhotos(): Promise<StoredPhoto[]> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    async deletePhoto(id: string): Promise<void> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const req = tx.objectStore(STORE_NAME).delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async getPhotoCount(): Promise<number> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    fileToDataUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}
