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
import type {
  CollectionReference,
  DocumentReference,
  Firestore,
} from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { ApplicationData } from '@/types/query';

export type ApplicationType = 'course_assistant' | 'supervised_teaching';

// Canonical shape is nested:
//   courses: { [semester]: { [courseId]: status } }
//
// Legacy shapes still supported during transition:
//   - Prefixed flat: `${semester}|||${courseId}` -> status
//   - Bare flat:     `${courseId}`               -> status
//
// resolveCourseStatus looks up a (courseId, optional semester) against any
// of these shapes. findCourseStatusPath returns the dotted Firestore field
// path pointing at the existing status, so writers update the right slot
// instead of creating a parallel key.
type AnyCourses = Record<string, unknown> | undefined;

export function resolveCourseStatus(
  courses: AnyCourses,
  courseKey: string,
  semester?: string
): string | undefined {
  if (!courses) return undefined;

  if (semester) {
    const bucket = (courses as any)[semester];
    if (bucket && typeof bucket === 'object' && courseKey in bucket) {
      const v = bucket[courseKey];
      if (typeof v === 'string') return v;
    }
  }

  for (const [, val] of Object.entries(courses)) {
    if (val && typeof val === 'object') {
      const nested = val as Record<string, unknown>;
      if (courseKey in nested && typeof nested[courseKey] === 'string') {
        return nested[courseKey] as string;
      }
    }
  }

  const bare = (courses as any)[courseKey];
  if (typeof bare === 'string') return bare;

  const suffix = `|||${courseKey}`;
  for (const key of Object.keys(courses)) {
    if (key.endsWith(suffix)) {
      const v = (courses as any)[key];
      if (typeof v === 'string') return v;
    }
  }

  return undefined;
}

function findCourseStatusPath(
  courses: AnyCourses,
  courseKey: string,
  semester?: string
): string | null {
  if (!courses) return null;

  if (semester) {
    const bucket = (courses as any)[semester];
    if (bucket && typeof bucket === 'object' && courseKey in bucket) {
      return `${semester}.${courseKey}`;
    }
  }

  for (const [bucketKey, val] of Object.entries(courses)) {
    if (val && typeof val === 'object') {
      const nested = val as Record<string, unknown>;
      if (courseKey in nested) return `${bucketKey}.${courseKey}`;
    }
  }

  if (Object.prototype.hasOwnProperty.call(courses, courseKey)) {
    return courseKey;
  }
  const suffix = `|||${courseKey}`;
  for (const key of Object.keys(courses)) {
    if (key.endsWith(suffix)) return key;
  }
  return null;
}

export class ApplicationRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  private applicationsCollection(type: ApplicationType): CollectionReference {
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
    status: 'applied' | 'approved' | 'denied' | 'accepted',
    semester?: string
  ): Promise<void> {
    await runTransaction(this.db, async (tx) => {
      const appRef = this.applicationDoc('course_assistant', applicationId);
      const appSnap = await tx.get(appRef);

      if (!appSnap.exists()) {
        throw new Error('Application not found');
      }

      const data = appSnap.data() as ApplicationData;
      const path =
        findCourseStatusPath(
          data.courses as Record<string, unknown>,
          courseKey,
          semester
        ) ||
        // No existing slot found: write to the canonical nested shape if we
        // have a semester, otherwise fall back to a bare key.
        (semester ? `${semester}.${courseKey}` : courseKey);

      tx.update(appRef, {
        [`courses.${path}`]: status,
        updated_at: serverTimestamp(),
      });
    });
  }

  async updateCourseStatusLatest(
    userId: string,
    courseKey: string,
    status: 'applied' | 'approved' | 'denied' | 'accepted',
    semester?: string
  ): Promise<void> {
    await this.updateCourseStatus(userId, courseKey, status, semester);
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
      const courseStatus = resolveCourseStatus(app.courses, courseKey);
      return Boolean(courseStatus && statuses.includes(courseStatus));
    });
  }
}
