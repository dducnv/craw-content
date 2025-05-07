import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface Question {
  id: string;
  questionNumber: string;
  questionText: string;
  answers: {
    label: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
  paragraph?: string;
  hasMultipleCorrect?: boolean;
}

interface CrawlerDB extends DBSchema {
  questions: {
    key: string;
    value: Question;
  };
}

class DatabaseService {
  private db: IDBPDatabase<CrawlerDB> | null = null;

  async init() {
    this.db = await openDB<CrawlerDB>('crawler-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('questions')) {
          db.createObjectStore('questions', { keyPath: 'id' });
        }
      },
    });
  }

  async saveQuestions(questions: Question[]) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('questions', 'readwrite');
    const store = tx.objectStore('questions');

    for (const question of questions) {
      await store.put(question);
    }

    await tx.done;
  }

  async getAllQuestions(): Promise<Question[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('questions', 'readonly');
    const store = tx.objectStore('questions');
    return store.getAll();
  }

  async clearQuestions() {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('questions', 'readwrite');
    const store = tx.objectStore('questions');
    await store.clear();
    await tx.done;
  }

  // Xóa toàn bộ database
  async deleteDatabase() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('crawler-db');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('Delete blocked'));
    });
  }
}

export const db = new DatabaseService(); 