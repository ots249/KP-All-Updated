import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { WebsiteConfig, CourseData } from '../types';
import { db, auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const LEGACY_BIN_ID = '69f41baaaaba8821975a738f';
const LEGACY_ACCESS_KEY = '$2a$10$SKEMI2vP7e4rY/j38puznOW9YN./DSe.RrCvxvUmBHUGzShIe7Oay';

export const API = {
  async fetchConfig(): Promise<WebsiteConfig> {
    const path = 'settings/config';
    try {
      // 1. Try Firebase first
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as WebsiteConfig;
        if (data.subjects && data.subjects.length > 0) {
          return data;
        }
      }
      
      // 2. Fallback to Jsonbin if Firebase is empty
      console.log('Firebase empty, falling back to Jsonbin...');
      return await this.fetchLegacyConfig(LEGACY_BIN_ID);
    } catch (error) {
      console.warn('Firebase fetch failed, trying legacy:', error);
      try {
        return await this.fetchLegacyConfig(LEGACY_BIN_ID);
      } catch (legacyError) {
        return { subjects: [] };
      }
    }
  },

  async fetchLegacyConfig(binId: string): Promise<WebsiteConfig> {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 
        'X-Master-Key': LEGACY_ACCESS_KEY,
        'X-Bin-Meta': 'false'
      }
    });
    if (!response.ok) throw new Error('Legacy fetch failed');
    return response.json();
  },

  async updateConfig(config: WebsiteConfig): Promise<void> {
    const path = 'settings/config';
    try {
      // Save to Firebase (Primary)
      await setDoc(doc(db, path), config);
      
      // Also sync to Jsonbin to keep it updated
      try {
        await fetch(`https://api.jsonbin.io/v3/b/${LEGACY_BIN_ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': LEGACY_ACCESS_KEY,
            'X-Bin-Meta': 'false'
          },
          body: JSON.stringify(config)
        });
      } catch (e) {
        console.error('Jsonbin sync failed:', e);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async fetchCourseData(url: string): Promise<CourseData> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch course data');
    return response.json();
  },

  onConfigUpdate(callback: (config: WebsiteConfig) => void) {
    return onSnapshot(doc(db, 'settings/config'), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as WebsiteConfig);
      }
    });
  }
};

export const AppStorage = {
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined') return null;
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  },
  set(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
};
