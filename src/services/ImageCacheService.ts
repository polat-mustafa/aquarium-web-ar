/**
 * Image Cache Service - Cache transformed images to avoid re-processing
 * Uses IndexedDB for persistent storage across sessions
 * OPTIMIZED: Won't affect camera performance - caching happens after transformation
 */

interface CachedImage {
  id: string;
  originalHash: string;
  styleId: string;
  imageBlob: Blob;
  timestamp: number;
  templateName: string;
}

class ImageCacheService {
  private dbName = 'aquarium-image-cache';
  private storeName = 'transformed-images';
  private maxCacheSize = 50; // Max 50 cached images
  private maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('originalHash', 'originalHash', { unique: false });
        }
      };
    });
  }

  /**
   * Generate hash for image blob (fast, non-cryptographic)
   */
  private async generateImageHash(blob: Blob): Promise<string> {
    // Use size + type + first few bytes as a fast hash
    const arrayBuffer = await blob.slice(0, 1024).arrayBuffer();
    const array = new Uint8Array(arrayBuffer);
    let hash = blob.size + blob.type.length;

    for (let i = 0; i < Math.min(array.length, 100); i++) {
      hash = ((hash << 5) - hash) + array[i];
      hash = hash & hash; // Convert to 32bit integer
    }

    return `${Math.abs(hash)}_${blob.size}_${blob.type}`;
  }

  /**
   * Check if transformed image exists in cache
   */
  async getCached(
    originalBlob: Blob,
    styleId: string
  ): Promise<Blob | null> {
    try {
      const db = await this.initDB();
      const hash = await this.generateImageHash(originalBlob);
      const cacheId = `${hash}_${styleId}`;

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.get(cacheId);

        request.onsuccess = () => {
          const cached = request.result as CachedImage | undefined;

          if (cached) {
            // Check if cache is still valid (not expired)
            const age = Date.now() - cached.timestamp;
            if (age < this.maxCacheAge) {
              console.log(`✨ Cache HIT for ${styleId} (${Math.round(age / 1000 / 60)} minutes old)`);
              resolve(cached.imageBlob);
            } else {
              console.log(`🗑️ Cache expired for ${styleId}`);
              // Delete expired cache
              this.deleteCached(cacheId);
              resolve(null);
            }
          } else {
            console.log(`❌ Cache MISS for ${styleId}`);
            resolve(null);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  /**
   * Store transformed image in cache
   */
  async setCached(
    originalBlob: Blob,
    styleId: string,
    transformedBlob: Blob,
    templateName: string
  ): Promise<void> {
    try {
      const db = await this.initDB();
      const hash = await this.generateImageHash(originalBlob);
      const cacheId = `${hash}_${styleId}`;

      const cachedImage: CachedImage = {
        id: cacheId,
        originalHash: hash,
        styleId,
        imageBlob: transformedBlob,
        timestamp: Date.now(),
        templateName,
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.put(cachedImage);

        request.onsuccess = () => {
          console.log(`💾 Cached ${templateName} transformation`);
          // Clean up old cache entries in background
          this.cleanupOldCache();
          resolve();
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  /**
   * Delete specific cached image
   */
  private async deleteCached(cacheId: string): Promise<void> {
    try {
      const db = await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.delete(cacheId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }

  /**
   * Clean up old cached images (background task)
   */
  private async cleanupOldCache(): Promise<void> {
    try {
      const db = await this.initDB();

      const transaction = db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('timestamp');
      const request = index.openCursor();

      const toDelete: string[] = [];
      const now = Date.now();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          const cached = cursor.value as CachedImage;
          const age = now - cached.timestamp;

          // Mark for deletion if expired
          if (age > this.maxCacheAge) {
            toDelete.push(cached.id);
          }

          cursor.continue();
        } else {
          // Delete expired entries
          toDelete.forEach((id) => objectStore.delete(id));

          if (toDelete.length > 0) {
            console.log(`🗑️ Cleaned up ${toDelete.length} expired cache entries`);
          }

          // Check cache size and remove oldest if needed
          this.enforceMaxCacheSize(objectStore);
        }
      };
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Enforce maximum cache size by removing oldest entries
   */
  private async enforceMaxCacheSize(objectStore: IDBObjectStore): Promise<void> {
    const countRequest = objectStore.count();

    countRequest.onsuccess = () => {
      const count = countRequest.result;

      if (count > this.maxCacheSize) {
        const index = objectStore.index('timestamp');
        const request = index.openCursor();
        const toDelete: string[] = [];
        let processed = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

          if (cursor && processed < (count - this.maxCacheSize)) {
            toDelete.push(cursor.value.id);
            processed++;
            cursor.continue();
          } else {
            // Delete oldest entries
            toDelete.forEach((id) => objectStore.delete(id));
            if (toDelete.length > 0) {
              console.log(`🗑️ Removed ${toDelete.length} oldest cache entries to enforce size limit`);
            }
          }
        };
      }
    };
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    try {
      const db = await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.clear();

        request.onsuccess = () => {
          console.log('🗑️ Cache cleared');
          resolve();
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    count: number;
    totalSize: number;
  }> {
    try {
      const db = await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.openCursor();

        let count = 0;
        let totalSize = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

          if (cursor) {
            count++;
            totalSize += (cursor.value as CachedImage).imageBlob.size;
            cursor.continue();
          } else {
            resolve({ count, totalSize });
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Cache stats error:', error);
      return { count: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();
