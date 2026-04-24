// Department entity — introduced in Unit 2 of multi-department support.
// Source of truth is the `departments/{id}` Firestore collection.

export type DepartmentStatus = 'active' | 'archived';

export interface Department {
  id: string; // deterministic slug of code, e.g. 'ece'
  code: string; // uppercase short code, e.g. 'ECE' (2–6 chars)
  name: string; // human-readable name
  status: DepartmentStatus;
  createdAt?: Date | null;
  archivedAt?: Date | null;
}
