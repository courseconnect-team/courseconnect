// Application Repository with backward compatibility
// Handles reading/writing applications from both old flat structure and new sub-collection structure

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  collectionGroup,
  Firestore,
  FieldValue,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';

export type ApplicationType = 'course_assistant' | 'supervised_teaching';

export interface ApplicationParent {
  firstname: string;
  lastname: string;
  email: string;
  ufid: string;
  application_type: ApplicationType | 'multi';
  latest_type: ApplicationType;
  updated_at: any;
  has_course_assistant?: boolean;
  has_supervised_teaching?: boolean;
  created_at?: any;
}

export interface BaseApplicationData {
  firstname: string;
  lastname: string;
  email: string;
  ufid: string;
  uid: string;
  date: string;
  status: string;
  application_type?: ApplicationType;
}

export interface CourseAssistantApplication extends BaseApplicationData {
  application_type: 'course_assistant';
  phonenumber: string;
  gpa: string;
  department: string;
  degree: string;
  semesterstatus: string;
  additionalprompt: string;
  nationality: string;
  englishproficiency: string;
  position: string;
  available_hours: string[];
  available_semesters: string[];
  courses: {
    [courseKey: string]: 'applied' | 'approved' | 'denied' | 'accepted';
  };
  qualifications: string;
  resume_link: string;
}

export interface SupervisedTeachingApplication extends BaseApplicationData {
  application_type: 'supervised_teaching';
  phdAdmissionTerm: string;
  phdAdvisor: string;
  admittedToCandidacy: string;
  registerTerm: string;
  previouslyRegistered: string;
  previousDetails: string;
  coursesComfortable: string;
  teachingFirst: string;
  teachingSecond: string;
  teachingThird: string;
}

export type ApplicationData =
  | CourseAssistantApplication
  | SupervisedTeachingApplication;

export class ApplicationRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Get a user's most recent application by type
   * Returns the latest application based on date field
   */
  async getLatestApplication(
    userId: string,
    type: ApplicationType
  ): Promise<ApplicationData | null> {
    const applications = await this.getUserApplications(userId, type);
    if (applications.length === 0) return null;

    // Sort by date descending and return the most recent
    applications.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return applications[0];
  }

  /**
   * Get all applications for a user of a specific type
   */
  async getUserApplications(
    userId: string,
    type: ApplicationType
  ): Promise<ApplicationData[]> {
    const applications: ApplicationData[] = [];

    // Check new sub-collection structure
    const typeCollectionRef = collection(this.db, 'applications', userId, type);
    const typeSnapshot = await getDocs(typeCollectionRef);

    typeSnapshot.forEach((doc) => {
      applications.push({ ...doc.data(), id: doc.id } as ApplicationData);
    });

    // Backward compatibility - check old flat structure if no new structure found
    if (applications.length === 0) {
      const oldRef = doc(this.db, 'applications', userId);
      const oldDoc = await getDoc(oldRef);

      if (oldDoc.exists()) {
        const data = oldDoc.data();
        const inferredType = this.inferApplicationType(data);
        if (inferredType === type) {
          applications.push({ ...data, id: userId } as ApplicationData);
        }
      }
    }

    return applications;
  }

  /**
   * Get a specific application by ID
   */
  async getApplicationById(
    userId: string,
    type: ApplicationType,
    applicationId: string
  ): Promise<ApplicationData | null> {
    // Try new structure
    const appRef = doc(this.db, 'applications', userId, type, applicationId);
    const appDoc = await getDoc(appRef);

    if (appDoc.exists()) {
      return { ...appDoc.data(), id: appDoc.id } as ApplicationData;
    }

    // Backward compatibility - if applicationId equals userId, check old flat structure
    if (applicationId === userId) {
      const oldRef = doc(this.db, 'applications', userId);
      const oldDoc = await getDoc(oldRef);

      if (oldDoc.exists()) {
        const data = oldDoc.data();
        const inferredType = this.inferApplicationType(data);
        if (inferredType === type) {
          return { ...data, id: userId } as ApplicationData;
        }
      }
    }

    return null;
  }

  /**
   * Get all applications for a specific type across all users
   * Uses collectionGroup query for new structure, falls back to collection query for old
   */
  async getAllApplicationsByType(
    type: ApplicationType
  ): Promise<ApplicationData[]> {
    const applications: ApplicationData[] = [];

    // Query new structure using collectionGroup
    // This queries all sub-collections named 'course_assistant' or 'supervised_teaching' across all users
    const typesQuery = collectionGroup(this.db, type);
    const typesSnapshot = await getDocs(typesQuery);

    typesSnapshot.forEach((doc) => {
      // Get userId from parent path: applications/{userId}/{type}/{applicationId}
      const userId = doc.ref.parent.parent?.id;
      applications.push({
        ...doc.data(),
        id: doc.id,
        userId: userId, // Include userId for reference
      } as ApplicationData);
    });

    // Also query old flat structure for backward compatibility
    const flatQuery = query(
      collection(this.db, 'applications'),
      where('application_type', '==', type)
    );
    const flatSnapshot = await getDocs(flatQuery);

    flatSnapshot.forEach((doc) => {
      // Only add if not already in results (check by document ID)
      if (!applications.some((app) => app.id === doc.id)) {
        applications.push({ ...doc.data(), id: doc.id } as ApplicationData);
      }
    });

    // For old data without application_type field, infer from schema
    if (type === 'course_assistant') {
      const legacySnapshot = await getDocs(collection(this.db, 'applications'));
      legacySnapshot.forEach((doc) => {
        const data = doc.data();
        // Infer course_assistant if has courses field and not already in results
        if (
          data.courses &&
          !data.application_type &&
          !applications.some((app) => app.id === doc.id)
        ) {
          applications.push({ ...data, id: doc.id } as ApplicationData);
        }
      });
    }

    return applications;
  }

  /**
   * Save an application (creates new document with auto-generated ID in sub-collection)
   * Returns the auto-generated application ID
   */
  async saveApplication(
    userId: string,
    type: ApplicationType,
    data: ApplicationData
  ): Promise<string> {
    // Create reference to sub-collection with auto-generated ID
    const typeCollectionRef = collection(this.db, 'applications', userId, type);

    // Add document with auto-generated ID
    const docRef = await addDoc(typeCollectionRef, {
      ...data,
      application_type: type,
      uid: userId, // Ensure userId is stored in document
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Update an existing application
   */
  async updateApplication(
    userId: string,
    type: ApplicationType,
    applicationId: string,
    updates: Partial<ApplicationData>
  ): Promise<void> {
    const appRef = doc(this.db, 'applications', userId, type, applicationId);

    await updateDoc(appRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  }

  /**
   * Update course status for a specific course assistant application (atomic transaction)
   */
  async updateCourseStatus(
    userId: string,
    applicationId: string,
    courseKey: string,
    status: 'applied' | 'approved' | 'denied' | 'accepted'
  ): Promise<void> {
    await runTransaction(this.db, async (tx) => {
      // Check new structure first
      const newRef = doc(
        this.db,
        'applications',
        userId,
        'course_assistant',
        applicationId
      );
      const newSnap = await tx.get(newRef);

      if (newSnap.exists()) {
        // Update in new structure
        tx.update(newRef, {
          [`courses.${courseKey}`]: status,
          updated_at: serverTimestamp(),
        });
      } else {
        // Fallback to old structure (applicationId should equal userId)
        const oldRef = doc(this.db, 'applications', userId);
        const oldSnap = await tx.get(oldRef);
        if (!oldSnap.exists()) {
          throw new Error('Application not found');
        }
        tx.update(oldRef, { [`courses.${courseKey}`]: status });
      }
    });
  }

  /**
   * Update course status for the LATEST course assistant application
   * (convenience method for backward compatibility)
   */
  async updateCourseStatusLatest(
    userId: string,
    courseKey: string,
    status: 'applied' | 'approved' | 'denied' | 'accepted'
  ): Promise<void> {
    const latestApp = await this.getLatestApplication(
      userId,
      'course_assistant'
    );

    if (!latestApp) {
      throw new Error('No course assistant application found for user');
    }

    await this.updateCourseStatus(userId, latestApp.id, courseKey, status);
  }

  /**
   * Update application status field for a specific application
   */
  async updateApplicationStatus(
    userId: string,
    type: ApplicationType,
    applicationId: string,
    status: string
  ): Promise<void> {
    await runTransaction(this.db, async (tx) => {
      // Check new structure first
      const newRef = doc(this.db, 'applications', userId, type, applicationId);
      const newSnap = await tx.get(newRef);

      if (newSnap.exists()) {
        // Update in new structure
        tx.update(newRef, {
          status,
          updated_at: serverTimestamp(),
        });
      } else {
        // Fallback to old structure
        const oldRef = doc(this.db, 'applications', userId);
        const oldSnap = await tx.get(oldRef);
        if (!oldSnap.exists()) {
          throw new Error('Application not found');
        }
        tx.update(oldRef, { status });
      }
    });
  }

  /**
   * Check if user has any applications of a specific type
   */
  async hasApplication(
    userId: string,
    type?: ApplicationType
  ): Promise<boolean> {
    if (type) {
      const apps = await this.getUserApplications(userId, type);
      return apps.length > 0;
    }

    // Check if user has any applications at all
    const courseAssistantApps = await this.getUserApplications(
      userId,
      'course_assistant'
    );
    const supervisedTeachingApps = await this.getUserApplications(
      userId,
      'supervised_teaching'
    );

    return courseAssistantApps.length > 0 || supervisedTeachingApps.length > 0;
  }

  /**
   * Infer application type from document data (for backward compatibility)
   */
  private inferApplicationType(data: any): ApplicationType {
    if (data.application_type) return data.application_type;

    // Infer based on schema: course_assistant has courses object
    return data.courses ? 'course_assistant' : 'supervised_teaching';
  }

  /**
   * Get applications for a specific course with status filtering
   * (Used by course application views)
   */
  async getApplicationsForCourse(
    courseKey: string,
    statuses: string[]
  ): Promise<ApplicationData[]> {
    const applications: ApplicationData[] = [];

    // This is specific to course_assistant applications only
    // Query all course_assistant applications
    const allApps = await this.getAllApplicationsByType('course_assistant');

    // Filter by course and status
    const filtered = allApps.filter((app) => {
      if (app.application_type !== 'course_assistant') return false;
      const courseAssistantApp = app as CourseAssistantApplication;
      const courseStatus = courseAssistantApp.courses?.[courseKey];
      return courseStatus && statuses.includes(courseStatus);
    });

    return filtered;
  }
}
