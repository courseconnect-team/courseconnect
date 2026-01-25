import { Announcement } from './announcement';
interface TA {
  name: string;
  email: string;
}

interface Schedule {
  day: string;
  location: string;
  time: string;
}

export interface CourseDetails {
  id: string;
  courseName: string;
  instructor: string;
  email: string;
  studentsEnrolled: number;
  maxStudents: number;
  courseCode: string;
  TAs: TA[];
  department: string;
  credits: number;
  semester: string;
  title: string;
  meetingTimes: Schedule[];
}

export type Position = 'TA' | 'UPI' | 'Grader';

export interface ApplicationData {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phonenumber: string;
  position: string;
  semester: string;
  employmentAction?: string;
  available_hours: string;
  department: string;
  degree: string;
  collegestatus: string;
  qualifications: string;
  resume_link: string;
  plan: string;
  gpa: string;
  date: string;
  status: string;
}

export type Status =
  | 'applied'
  | 'Assigned'
  | 'Admin_approved'
  | 'Admin_denied'
  | 'denied'
  | 'accepted';

export type ApplicationStatus = 'Approved' | 'Denied' | 'Assigned' | 'applied';

export type StatusFilter = 'All' | 'Approved' | 'Denied';

export type AppRow = {
  id: string; // application doc id
  status: string; // 'applied' | 'approved' | 'denied' | 'Admin_denied' | 'assigned'
  data: ApplicationData; // the whole doc (for name, submitted date, etc.)
};

import { UseQueryOptions } from '@tanstack/react-query';
/** Typed query key for easy invalidation elsewhere */
export type AppQueryKey = ['application', string];

/** Allow callers to pass common RQ options, but keep the key/fn internal */

export type ApplicationOptions = Omit<
  UseQueryOptions<
    ApplicationData | null,
    Error,
    ApplicationData | null,
    AppQueryKey
  >,
  'queryKey' | 'queryFn'
>;

type AnnouncementByIdKey = ['announcements', 'id', string];

export type AnnouncementByIdOptions = Omit<
  UseQueryOptions<
    Announcement | null,
    Error,
    Announcement | null,
    AnnouncementByIdKey
  >,
  'queryKey' | 'queryFn'
>;
