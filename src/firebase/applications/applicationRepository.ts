// Application Repository
// Canonical structure:
// applications/{applicationType}/uid/{uid}

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import type { CollectionReference, DocumentReference, Firestore } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { ApplicationData } from '@/types/query';

export type ApplicationType = 'course_assistant' | 'supervised_teaching';

export class ApplicationRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  private applicationsCollection(
    type: ApplicationType
  ): CollectionReference {
    return collection(this.db, 'applications', type, 'uid');
  }

  private applicationDoc(
    type: ApplicationType,
    userId: string
  ): DocumentReference {
    return doc(this.db, 'applications', type, 'uid', userId);
  }

  /**
   * With uid-addressed docs, the "latest" application is the single canonical user doc.
   */
  async getLatestApplication(
    userId: string,
    type: ApplicationType
  ): Promise<ApplicationData | null> {
    const app = await this.getApplicationById(type, userId);
    return app;
  }

  /**
   * Returns 0 or 1 item for this schema (single doc per uid/type).
   */
  async getUserApplications(
    userId: string,
    type: ApplicationType
  ): Promise<ApplicationData[]> {
    const app = await this.getApplicationById(type, userId);
    return app ? [app] : [];
  }

  /**
   * applicationId maps to uid in this schema.
   */
  async getApplicationById(
    type: ApplicationType,
    applicationId: string
  ): Promise<ApplicationData | null> {
    const appRef = this.applicationDoc(type, applicationId);
    const appDoc = await getDoc(appRef);

    if (!appDoc.exists()) {
      return null;
    }

    return { ...appDoc.data(), id: appDoc.id } as ApplicationData;
  }

  async getAllApplicationsByType(
    type: ApplicationType
  ): Promise<ApplicationData[]> {
    const applications: ApplicationData[] = [];
    const snapshot = await getDocs(this.applicationsCollection(type));

    snapshot.forEach((snap) => {
      applications.push({
        ...snap.data(),
        id: snap.id,
      } as ApplicationData);
    });

    return applications;
  }

  /**
   * Upserts one canonical application document for user/type.
   * Returns uid.
   */
  async saveApplication(
    userId: string,
    type: ApplicationType,
    data: ApplicationData
  ): Promise<string> {
    const appRef = this.applicationDoc(type, userId);

    await runTransaction(this.db, async (tx) => {
      const existing = await tx.get(appRef);
      const payload: Record<string, unknown> = {
        ...data,
        application_type: type,
        uid: userId,
        updated_at: serverTimestamp(),
      };

      delete payload.created_at;
      delete payload.updated_at;

      if (!existing.exists()) {
        payload.created_at = serverTimestamp();
      }

      tx.set(appRef, payload, { merge: true });
    });

    return userId;
  }

  /**
   * applicationId maps to uid in this schema.
   */
  async updateApplication(
    type: ApplicationType,
    applicationId: string,
    updates: Partial<ApplicationData>
  ): Promise<void> {
    const appRef = this.applicationDoc(type, applicationId);

    await updateDoc(appRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  }

  /**
   * applicationId maps to uid in this schema.
   */
  async updateCourseStatus(
    applicationId: string,
    courseKey: string,
    status: 'applied' | 'approved' | 'denied' | 'accepted'
  ): Promise<void> {
    await runTransaction(this.db, async (tx) => {
      const appRef = this.applicationDoc('course_assistant', applicationId);
      const appSnap = await tx.get(appRef);

      if (!appSnap.exists()) {
        throw new Error('Application not found');
      }

      tx.update(appRef, {
        [`courses.${courseKey}`]: status,
        updated_at: serverTimestamp(),
      });
    });
  }

  async updateCourseStatusLatest(
    userId: string,
    courseKey: string,
    status: 'applied' | 'approved' | 'denied' | 'accepted'
  ): Promise<void> {
    await this.updateCourseStatus(userId, courseKey, status);
  }

  /**
   * applicationId maps to uid in this schema.
   */
  async updateApplicationStatus(
    type: ApplicationType,
    applicationId: string,
    status: string
  ): Promise<void> {
    await runTransaction(this.db, async (tx) => {
      const appRef = this.applicationDoc(type, applicationId);
      const appSnap = await tx.get(appRef);

      if (!appSnap.exists()) {
        throw new Error('Application not found');
      }

      tx.update(appRef, {
        status,
        updated_at: serverTimestamp(),
      });
    });
  }

  async hasApplication(
    userId: string,
    type?: ApplicationType
  ): Promise<boolean> {
    if (type) {
      const app = await this.getApplicationById(type, userId);
      return Boolean(app);
    }

    const [courseAssistantApp, supervisedTeachingApp] = await Promise.all([
      this.getApplicationById('course_assistant', userId),
      this.getApplicationById('supervised_teaching', userId),
    ]);

    return Boolean(courseAssistantApp || supervisedTeachingApp);
  }

  async getApplicationsForCourse(
    courseKey: string,
    statuses: string[]
  ): Promise<ApplicationData[]> {
    const allApps = await this.getAllApplicationsByType('course_assistant');

    return allApps.filter((app) => {
      const courseStatus = app.courses?.[courseKey];
      return Boolean(courseStatus && statuses.includes(courseStatus));
    });
  }
}
