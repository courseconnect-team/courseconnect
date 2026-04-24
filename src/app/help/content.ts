import { SvgIconComponent } from '@mui/icons-material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';

export type HelpRoleKey = 'student' | 'faculty' | 'admin';

export type HelpSection = {
  id: string;
  title: string;
  icon: SvgIconComponent;
  path?: string;
  summary: string;
  steps: string[];
  tips?: string[];
};

export type HelpGuide = {
  key: HelpRoleKey;
  label: string;
  tagline: string;
  overview: string;
  quickStart: string[];
  sections: HelpSection[];
  faqs: { q: string; a: string }[];
};

export const STUDENT_GUIDE: HelpGuide = {
  key: 'student',
  label: 'Student',
  tagline: 'Apply for assistantships, browse research, and track your status.',
  overview:
    'As a student you can apply to be a Course Assistant, apply for Supervised Teaching (EEL 6940), browse and apply to faculty research positions, and follow every decision in one place.',
  quickStart: [
    'Open the Dashboard from the ECE logo in the top-left to see every tool available to you.',
    'Go to Applications to start a Course Assistant or Supervised Teaching application.',
    'Visit Research to browse open faculty positions and submit interest.',
    'Use Status to monitor decisions, and check Announcements (bell icon) for updates.',
  ],
  sections: [
    {
      id: 'applications',
      title: 'Applications',
      icon: DescriptionOutlinedIcon,
      path: '/applications',
      summary:
        'Choose between Course Assistant (undergraduate / MS TA) and Supervised Teaching (PhD EEL 6940) and submit a complete application.',
      steps: [
        'Open Applications from the sidebar and pick Course Assistant or Supervised Teaching.',
        'Fill in your personal info: name, UF email, UFID, phone, department, and GPA.',
        'Course Assistant: choose your degree level, semester status, position type, and weekly availability (7, 14, or 20 hrs). Multi-select the courses you would like to assist, paste a Google Drive link to your resume, and write your qualifications statement.',
        'Supervised Teaching: list your advisor and candidacy status, indicate prior EEL 6940 registrations, list courses you can teach, and rank your three teaching-area preferences.',
        'Complete the CAPTCHA and press Submit. You will receive a confirmation email and your role will update to "Applied."',
      ],
      tips: [
        'You can resubmit — the latest submission replaces the previous one on the same application.',
        'Only UF email addresses are accepted.',
      ],
    },
    {
      id: 'research',
      title: 'Research',
      icon: ScienceOutlinedIcon,
      path: '/Research',
      summary:
        'Browse faculty research positions and apply to the ones that fit.',
      steps: [
        'Open Research to see every open listing.',
        'Filter by Department and Student Level, or search by keyword to narrow results.',
        'Click a project card to read the full description, mentor, contact, and terms available.',
        'Submit your interest from the project detail dialog; the faculty mentor is notified automatically.',
      ],
      tips: [
        'Keep an eye on "Terms Available" — some listings are single-semester only.',
      ],
    },
    {
      id: 'status',
      title: 'Status',
      icon: CheckBoxOutlinedIcon,
      path: '/status',
      summary:
        'A single dashboard of every application you have submitted and every decision made on it.',
      steps: [
        'Open Status from the sidebar.',
        'Each row shows the position type, course, semester, date applied, and current decision (Applied, Approved, Denied, or Accepted).',
        'If you have no submissions yet, the page shows a friendly "No applications or assignments" message.',
      ],
    },
    {
      id: 'announcements',
      title: 'Announcements',
      icon: CampaignOutlinedIcon,
      path: '/announcements',
      summary:
        'Department announcements in one inbox, with unread tracking and acknowledgments.',
      steps: [
        'Open Announcements from the sidebar or the bell icon in the top bar.',
        'Unread items sit at the top; click any item to read the full message.',
        'Use "Mark as read / unread" on a single item, or "Mark all read" to clear the list.',
        'If an announcement requires acknowledgment, you must click the acknowledge button before it is dismissed.',
      ],
      tips: ['The red number on the bell is your unread count.'],
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: AccountCircleOutlinedIcon,
      path: '/Profile',
      summary: 'Review your account info and role.',
      steps: [
        'Click your avatar in the top-right to open your profile.',
        'Check that your name, email, department, UFID, and role are correct.',
        'Contact the department if anything is wrong — profile edits are handled by admins.',
      ],
    },
  ],
  faqs: [
    {
      q: 'Can I apply to Course Assistant and Supervised Teaching at the same time?',
      a: 'Yes. They are separate applications and are reviewed independently.',
    },
    {
      q: 'How will I know when I have been accepted?',
      a: 'Decisions appear on the Status page, and acceptance notices go to your UF email.',
    },
    {
      q: 'Can I edit an application after submitting?',
      a: 'Submit again with the corrected info — the new submission replaces the old one.',
    },
  ],
};

export const FACULTY_GUIDE: HelpGuide = {
  key: 'faculty',
  label: 'Faculty',
  tagline:
    'Review applicants, manage your courses, and post research positions.',
  overview:
    'Faculty members review TA and Supervised Teaching applicants for their courses, manage course rosters, post research opportunities, and broadcast announcements.',
  quickStart: [
    'Open Applications to see students who applied to courses you teach.',
    'Open Courses to review your current and past semester assignments.',
    'Open Research to post a new position or manage existing ones.',
    'Use Announcements to broadcast updates to students, other faculty, or specific users.',
  ],
  sections: [
    {
      id: 'applications',
      title: 'Applications',
      icon: DescriptionOutlinedIcon,
      path: '/applications',
      summary:
        'Review the students who applied to courses you teach, with full application details attached.',
      steps: [
        'Open Applications from the sidebar.',
        'Browse the list of applicants matched to your courses; click a row to see the full application, resume link, and qualifications.',
        'Use the filters to narrow by semester or status.',
      ],
      tips: [
        'Final acceptance is coordinated with the admin team — your review informs the decision.',
      ],
    },
    {
      id: 'research',
      title: 'Research',
      icon: ScienceOutlinedIcon,
      path: '/Research',
      summary: 'Post research opportunities and see who has applied.',
      steps: [
        'Open Research. You will see two tabs: "My Positions" and "Research Board."',
        'In "My Positions," click the add button to create a new listing. Fill in title, description, department, mentor, contact, and terms available, then publish.',
        'Edit or unpublish a listing at any time from the same tab.',
        'Switch to "Research Board" to see everything students see across the department.',
      ],
      tips: [
        'Keep descriptions specific about outcomes and time commitment — you will get better-matched applicants.',
      ],
    },
    {
      id: 'courses',
      title: 'Courses',
      icon: BookOutlinedIcon,
      path: '/courses',
      summary:
        'See the courses you are assigned for the current and past semesters.',
      steps: [
        'Open Courses from the sidebar.',
        'The grid shows each course with code, title, class number, credits, meeting times, and enrollment.',
        'Use the semester multi-select to view historical teaching assignments.',
      ],
      tips: ['Courses appear here after the admin uploads the semester data.'],
    },
    {
      id: 'announcements',
      title: 'Announcements',
      icon: CampaignOutlinedIcon,
      path: '/announcements',
      summary: 'Read announcements and publish your own to any audience.',
      steps: [
        'Open Announcements and read the current inbox like any user.',
        'Click "Add Announcement" to open the composer.',
        'Fill in Title and Body (Markdown supported). Optionally pin the message, require acknowledgment, send via email, and set an expiration date.',
        'Pick an audience: All users, specific Roles, specific Departments, or a custom list of users.',
        'Schedule a future publish time or publish immediately. A preview shows the first ~140 characters.',
      ],
      tips: [
        'Scheduled announcements in the past are published immediately on save.',
        'Require acknowledgment only when you need a confirmed read — it is more friction for students.',
      ],
    },
  ],
  faqs: [
    {
      q: 'Why am I not seeing a student who applied to my course?',
      a: 'Confirm the course was part of the latest admin upload for the semester and that the student submitted their application (not just drafted it).',
    },
    {
      q: 'Can I delete a research listing?',
      a: 'Yes, from the "My Positions" tab on the Research page.',
    },
    {
      q: 'Who can see an announcement I post?',
      a: 'Exactly the audience you select in the composer — All, by Role, by Department, or a specific user list.',
    },
  ],
};

export const ADMIN_GUIDE: HelpGuide = {
  key: 'admin',
  label: 'Admin',
  tagline: 'Manage users, review applications, and run the semester.',
  overview:
    'Admins run their department end-to-end: approving faculty accounts, reviewing every TA and Supervised Teaching application, populating the semester course list (auto-fetch or Excel upload), tracking faculty teaching load, and publishing announcements. Everything you do is scoped to your active department. Super admins additionally create and manage departments themselves.',
  quickStart: [
    'Start each semester in Courses — create a fetch workflow to auto-populate from one.uf.edu, or upload the Excel roster manually, then load employment actions.',
    'Approve any pending faculty accounts in Users → Unapproved Faculty.',
    'Review submitted applications in Applications and approve / deny in bulk or individually.',
    'Upload teaching-load data in Faculty Stats so assignment decisions are well-informed.',
    'Super admin only: open Departments to onboard a new department or invite additional admins/faculty.',
  ],
  sections: [
    {
      id: 'users',
      title: 'Users',
      icon: PersonOutlineOutlinedIcon,
      path: '/users',
      summary:
        'The directory of every account in the system, plus the approval queue for new faculty.',
      steps: [
        'Open Users from the sidebar.',
        'Tab 1 "All Users": search, filter, and paginate the full list. Inspect or update role and department.',
        'Tab 2 "Unapproved Faculty": review each request and approve to promote the account from "unapproved" to "faculty."',
      ],
      tips: [
        'Unapproved accounts have no sidebar access until you promote them.',
      ],
    },
    {
      id: 'applications',
      title: 'Applications',
      icon: DescriptionOutlinedIcon,
      path: '/admin-applications',
      summary:
        'Review every submitted Course Assistant and Supervised Teaching application, in one grid.',
      steps: [
        'Open Applications from the sidebar.',
        'Filter by status (Submitted / Approved / Denied) or search by student.',
        'Click a row to inspect full details, download the resume, and approve or deny.',
        'Use the bulk actions to process multiple applications at once after confirming the selection.',
      ],
      tips: [
        'Approvals drive the Status page students see — keep decisions timely.',
      ],
    },
    {
      id: 'courses',
      title: 'Courses',
      icon: BookOutlinedIcon,
      path: '/admincourses',
      summary:
        'Populate, maintain, and curate the semester course list. Three tabs: Auto-fetch (scheduled scrape), Upload & maintain (Excel), and Manage courses (row-level review). Every course you write is stamped with your active department.',
      steps: [
        'Pick the target semester at the top, or create a new one. Use Hide/Unhide to control whether students can see it — keep it hidden while you stage data.',
        'Auto-fetch tab: click "New workflow" to build a pipeline — choose a source (e.g. one.uf.edu), filter by department / code prefix / course number range / level / campus, pick a refresh cadence (manual, hourly, daily, weekly, or every N hours), and point it at a semester. Toggle Enabled to arm the schedule.',
        'Auto-fetch → Preview: always run Preview first on a new workflow. The dialog shows a new-vs-update diff so you know what will change before applying. "Run now" triggers it on demand; History shows past runs with counts and any errors.',
        'Upload & maintain tab: use "Upload Semester Data" to ingest an Excel course list manually (code, title, instructor emails, meeting times, enrollment cap). "Upload Employment Actions" attaches the UFID → action mapping for the term. Manual uploads are preserved across auto-fetch runs.',
        'Manage courses tab: browse the rows currently in the semester, edit typos, and remove stragglers. "Clear Semester Data" wipes every course for the selected semester — use only when you are about to reload from scratch.',
      ],
      tips: [
        'Your active department is stamped on every course you write — whether auto-fetched or uploaded. Super admins who belong to multiple departments should confirm the active department in their Profile before writing.',
        'Preview before "Run now": the dry-run catches filter mistakes (wrong code prefix, stale term) without touching Firestore.',
        'Partial-success status means some sections errored; open History on the workflow to see which ones.',
        'If the Auto-fetch tab says it cannot load workflows, the course-fetch Cloud Functions are not deployed — redeploy from functions/.',
        'Clearing is permanent. Back up the Excel source (or disable workflows) before running it.',
      ],
    },
    {
      id: 'departments',
      title: 'Departments',
      icon: ApartmentOutlinedIcon,
      path: '/admin/departments',
      summary:
        'Super-admin only. Create and archive departments, and manage who is admin or faculty in each one. Every course, application, announcement, and research listing is scoped by department, so this is where onboarding a new department starts.',
      steps: [
        'Open Departments from the sidebar. The list shows every department with status (Active / Archived) and its id.',
        'Click "New department" to onboard a department. Enter a 2–6 letter code (e.g. ECE, CISE, MAE), the full name, and the email of the first admin. Submitting creates the department and queues an invite.',
        'The invited admin receives an email; they gain access the first time they sign in with that email. If the invite fails while the department succeeds, use the "Resend" action on the error banner.',
        "Click a department to open its detail page. Under Members, invite additional admins or faculty by email, change a member's role, or remove access. Pending invites show separately until the user first signs in.",
        'Archive a department to revoke its admin nav and hide its surfaces; Unarchive restores it. Archiving does not delete data — courses, applications, and announcements for that department are retained.',
      ],
      tips: [
        'Only super admins see the Departments nav entry. Department admins cannot create or archive departments.',
        'A user can belong to multiple departments with different roles (e.g. admin in CISE, faculty in ECE). Each membership is tracked independently.',
        'Initial seed — if the list is empty, either seed ECE/CISE/MAE via the seed:departments script or create the first department manually.',
      ],
    },
    {
      id: 'faculty-stats',
      title: 'Faculty Stats',
      icon: BarChartOutlinedIcon,
      path: '/faculty-stats',
      summary:
        'Track teaching load and research level per instructor to inform assignments.',
      steps: [
        'Open Faculty Stats from the sidebar.',
        'Upload the "Teaching Load History" Excel sheet to refresh the table.',
        "Review each instructor's load category and research level in the table.",
        'Use "Clear Faculty Data" to start from scratch (confirmation required).',
      ],
    },
    {
      id: 'research',
      title: 'Research',
      icon: ScienceOutlinedIcon,
      path: '/Research',
      summary:
        'Administrative view of every research listing; you can create and manage positions like faculty.',
      steps: [
        'Open Research to see the same two tabs faculty see.',
        'Use "My Positions" to create or edit listings; use "Research Board" to see what students see.',
      ],
    },
    {
      id: 'announcements',
      title: 'Announcements',
      icon: CampaignOutlinedIcon,
      path: '/announcements',
      summary:
        'Publish to any audience with full targeting, scheduling, and acknowledgment controls.',
      steps: [
        'Open Announcements and click "Add Announcement."',
        'Write Title + Markdown Body; optionally pin, require acknowledgment, or send via email.',
        'Pick an audience: All, specific Roles, Departments, or a user list.',
        'Schedule publish and expiration dates, then save.',
      ],
      tips: [
        'The audience selector supports autocomplete for named users.',
        'Past-dated schedules publish immediately on save.',
      ],
    },
  ],
  faqs: [
    {
      q: 'A faculty member says their course is not showing up — why?',
      a: 'Check the Courses page: the semester may be hidden, the course may be missing from the latest auto-fetch or Excel upload, or it may have been ingested under a different department. Open the Manage courses tab and confirm the row exists with the right department stamp.',
    },
    {
      q: 'How do I bulk-deny applications that are out of scope?',
      a: 'Filter to the subset you want, select the rows, and use the bulk deny action. Confirm the dialog to apply.',
    },
    {
      q: 'Can I recover cleared semester data?',
      a: 'No. "Clear Semester Data" is destructive. Back up the Excel source (or re-run the fetch workflow) before clearing.',
    },
    {
      q: 'Do auto-fetch runs overwrite courses I fixed up by hand?',
      a: 'Fetch runs upsert by course key within the target semester. Fields pulled from the provider are refreshed; fields you added that the provider does not populate are preserved. Preview the diff first if you are unsure — the dialog shows adds vs. updates.',
    },
    {
      q: 'A fetch workflow is stuck in "running" — what do I do?',
      a: 'Open History on the workflow to see the run record. If the provider timed out, disable the schedule, fix the config (filters too broad, wrong term), then Preview + Run now to retry.',
    },
    {
      q: 'How do I add a new department to Course Connect?',
      a: 'Super admin only: open Departments → New department, enter the code / name / first admin email, and submit. The admin gets access on their first sign-in with that email, and can then invite faculty from the department detail page.',
    },
    {
      q: 'I belong to more than one department — which one am I writing into?',
      a: 'Your active department governs uploads and fetch stamping. It is visible in your Profile. If it is wrong, switch it there before running an Excel upload or a course fetch.',
    },
  ],
};

export const HELP_GUIDES: Record<HelpRoleKey, HelpGuide> = {
  student: STUDENT_GUIDE,
  faculty: FACULTY_GUIDE,
  admin: ADMIN_GUIDE,
};

export const HELP_ROLE_ORDER: HelpRoleKey[] = ['student', 'faculty', 'admin'];
