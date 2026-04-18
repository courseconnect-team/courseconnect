import { SvgIconComponent } from '@mui/icons-material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

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
    'Admins operate the department-wide workflow: approving faculty accounts, reviewing every TA and Supervised Teaching application, uploading semester course data, tracking faculty teaching load, and publishing announcements.',
  quickStart: [
    'Start each semester by uploading course data and employment actions in Courses.',
    'Approve any pending faculty accounts in Users → Unapproved Faculty.',
    'Review submitted applications in Applications and approve / deny in bulk or individually.',
    'Upload teaching-load data in Faculty Stats so assignment decisions are well-informed.',
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
        'The canonical source of semester course data. Upload, hide, and clear semesters here.',
      steps: [
        'Select an existing semester from the dropdown or create a new one.',
        'Use "Upload Semester Data" to ingest the Excel course list (code, title, instructor emails, meeting times, enrollment cap).',
        'Use "Upload Employment Actions" to attach the UFID → action mapping for the term.',
        'Hide / Unhide a semester to control whether students can see it.',
        '"Clear Semester Data" wipes every course for the selected semester — use with caution.',
      ],
      tips: [
        'Hide the semester until uploads are complete, then unhide to make it visible.',
        'Clearing is permanent — export or back up before running it.',
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
      a: 'Check the Courses page: the semester may be hidden, or that course may be missing from the most recent upload.',
    },
    {
      q: 'How do I bulk-deny applications that are out of scope?',
      a: 'Filter to the subset you want, select the rows, and use the bulk deny action. Confirm the dialog to apply.',
    },
    {
      q: 'Can I recover cleared semester data?',
      a: 'No. "Clear Semester Data" is destructive. Back up the Excel source before clearing.',
    },
  ],
};

export const HELP_GUIDES: Record<HelpRoleKey, HelpGuide> = {
  student: STUDENT_GUIDE,
  faculty: FACULTY_GUIDE,
  admin: ADMIN_GUIDE,
};

export const HELP_ROLE_ORDER: HelpRoleKey[] = ['student', 'faculty', 'admin'];
