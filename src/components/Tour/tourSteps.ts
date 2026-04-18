import { HelpRoleKey } from '@/app/help/content';

export type Placement = 'right' | 'bottom' | 'left' | 'top' | 'center';

export type TourStep = {
  id: string;
  title: string;
  body: string;
  /** CSS selector for the element to spotlight. Omit for a centered modal step. */
  target?: string;
  placement?: Placement;
};

const TOPBAR_STEPS: TourStep[] = [
  {
    id: 'topbar',
    target: '[data-tour="topbar"]',
    placement: 'bottom',
    title: 'Your top bar',
    body: 'Your profile, the department logo (which links back to the Dashboard), and the announcements bell live here on every page.',
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    placement: 'bottom',
    title: 'Announcements inbox',
    body: 'The red badge shows your unread count. Click the bell to jump straight to announcements from anywhere.',
  },
  {
    id: 'profile',
    target: '[data-tour="profile"]',
    placement: 'bottom',
    title: 'Your profile',
    body: 'Your name and current role are shown here. Click to open your profile details.',
  },
];

const END_STEP = (closing: string): TourStep => ({
  id: 'end',
  title: "You're all set",
  body: closing,
});

export const TOUR_STEPS: Record<HelpRoleKey, TourStep[]> = {
  student: [
    {
      id: 'welcome',
      title: 'Welcome to CourseConnect',
      body: 'Take a 60-second tour of the tools available to you as a student. You can skip any time with the button in the top-right of this card.',
    },
    {
      id: 'sidebar',
      target: '[data-tour="sidebar"]',
      placement: 'right',
      title: 'Your sidebar',
      body: 'Every feature lives on this sidebar. The icons stay visible on every page so you always know where to go next.',
    },
    {
      id: 'nav-applications',
      target: '[data-testid="nav-Applications"]',
      placement: 'right',
      title: 'Applications',
      body: 'Submit a Course Assistant (undergrad / MS TA) or Supervised Teaching (PhD EEL 6940) application here.',
    },
    {
      id: 'nav-research',
      target: '[data-testid="nav-Research"]',
      placement: 'right',
      title: 'Research',
      body: 'Browse faculty-posted research positions and submit interest to the ones that match your goals.',
    },
    {
      id: 'nav-status',
      target: '[data-testid="nav-Status"]',
      placement: 'right',
      title: 'Status',
      body: 'A live view of every application you have submitted, with the current decision for each one.',
    },
    {
      id: 'nav-announcements',
      target: '[data-testid="nav-Announcements"]',
      placement: 'right',
      title: 'Announcements',
      body: 'Department-wide updates. Some may require you to acknowledge them before they are dismissed.',
    },
    {
      id: 'nav-help',
      target: '[data-testid="nav-Help"]',
      placement: 'right',
      title: 'Help Center',
      body: "You're here. Come back any time to re-run this tour or read the step-by-step guides.",
    },
    ...TOPBAR_STEPS,
    END_STEP(
      'Start with Applications to submit your first application, or Research to find a position that fits.'
    ),
  ],

  faculty: [
    {
      id: 'welcome',
      title: 'Welcome, faculty',
      body: 'A quick tour of the tools you use to review applicants, manage your courses, and post research opportunities.',
    },
    {
      id: 'sidebar',
      target: '[data-tour="sidebar"]',
      placement: 'right',
      title: 'Your sidebar',
      body: 'All of your tools are one click away from this bar, on every page.',
    },
    {
      id: 'nav-applications',
      target: '[data-testid="nav-Applications"]',
      placement: 'right',
      title: 'Applicants',
      body: 'Review the students who applied to courses you teach — resumes, qualifications, and course preferences in one view.',
    },
    {
      id: 'nav-research',
      target: '[data-testid="nav-Research"]',
      placement: 'right',
      title: 'Research',
      body: 'Post and manage your own research positions under "My Positions," and browse the full board students see.',
    },
    {
      id: 'nav-courses',
      target: '[data-testid="nav-Courses"]',
      placement: 'right',
      title: 'Courses',
      body: 'Your current and past teaching assignments, with enrollment, meeting times, and class numbers.',
    },
    {
      id: 'nav-announcements',
      target: '[data-testid="nav-Announcements"]',
      placement: 'right',
      title: 'Announcements',
      body: 'Read the inbox and publish your own announcements. You can target by role, department, or specific users, and require acknowledgment.',
    },
    {
      id: 'nav-help',
      target: '[data-testid="nav-Help"]',
      placement: 'right',
      title: 'Help Center',
      body: 'Return here any time for detailed how-tos and to re-run this walkthrough.',
    },
    ...TOPBAR_STEPS,
    END_STEP(
      'Open Applications to review incoming students, or Research to post your next opportunity.'
    ),
  ],

  admin: [
    {
      id: 'welcome',
      title: 'Welcome, admin',
      body: 'This tour covers the full toolkit you use to run the department semester end-to-end.',
    },
    {
      id: 'sidebar',
      target: '[data-tour="sidebar"]',
      placement: 'right',
      title: 'Your sidebar',
      body: 'All admin tools live here. Order is optimized for the way the semester flows.',
    },
    {
      id: 'nav-users',
      target: '[data-testid="nav-Users"]',
      placement: 'right',
      title: 'Users',
      body: 'The directory of every account. Use the "Unapproved Faculty" tab to promote new faculty accounts.',
    },
    {
      id: 'nav-applications',
      target: '[data-testid="nav-Applications"]',
      placement: 'right',
      title: 'Applications',
      body: 'Review, approve, or deny every submitted TA and Supervised Teaching application — individually or in bulk.',
    },
    {
      id: 'nav-courses',
      target: '[data-testid="nav-Courses"]',
      placement: 'right',
      title: 'Courses',
      body: 'Upload semester data and employment actions, hide semesters until ready, or clear a semester when retiring it.',
    },
    {
      id: 'nav-faculty-stats',
      target: '[data-testid="nav-Faculty Stats"]',
      placement: 'right',
      title: 'Faculty Stats',
      body: 'Teaching load and research level per instructor, driven by an uploaded Excel sheet. Informs assignment decisions.',
    },
    {
      id: 'nav-research',
      target: '[data-testid="nav-Research"]',
      placement: 'right',
      title: 'Research',
      body: 'Post and manage research listings with the same tools faculty use.',
    },
    {
      id: 'nav-announcements',
      target: '[data-testid="nav-Announcements"]',
      placement: 'right',
      title: 'Announcements',
      body: 'Publish to any audience: everyone, by role, by department, or a specific user list. Schedule, pin, or require acknowledgment.',
    },
    {
      id: 'nav-help',
      target: '[data-testid="nav-Help"]',
      placement: 'right',
      title: 'Help Center',
      body: 'Role-aware guides plus this walkthrough are always one click away.',
    },
    ...TOPBAR_STEPS,
    END_STEP(
      'A natural starting point: upload course data in Courses, then approve any pending faculty in Users.'
    ),
  ],
};
